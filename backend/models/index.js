const mongoose = require('mongoose');
const { memoryStore, isUsingMemoryStore } = require('../config/db');
const {
  UserSchema,
  ProductSchema,
  PlanSchema,
  QuotationTemplateSchema,
  SubscriptionSchema,
  DiscountSchema,
  TaxRuleSchema,
  InvoiceSchema,
  PaymentSchema
} = require('./schemas');

// Initialize Mongoose Models
const MongooseModels = {
  User: mongoose.model('User', UserSchema),
  Product: mongoose.model('Product', ProductSchema),
  Plan: mongoose.model('Plan', PlanSchema),
  QuotationTemplate: mongoose.model('QuotationTemplate', QuotationTemplateSchema),
  Subscription: mongoose.model('Subscription', SubscriptionSchema),
  Discount: mongoose.model('Discount', DiscountSchema),
  TaxRule: mongoose.model('TaxRule', TaxRuleSchema),
  Invoice: mongoose.model('Invoice', InvoiceSchema),
  Payment: mongoose.model('Payment', PaymentSchema)
};

// Generic Repository Adapter handling both Mongoose and In-Memory
class Repository {
  constructor(modelName, collectionName) {
    this.modelName = modelName;
    this.collectionName = collectionName;
  }

  get mongooseModel() {
    return MongooseModels[this.modelName];
  }

  matchesFilter(item, filter = {}) {
    for (const key of Object.keys(filter)) {
      const val = filter[key];
      if (key === '$or' && Array.isArray(val)) {
        const matchesAny = val.some(subFilter => this.matchesFilter(item, subFilter));
        if (!matchesAny) return false;
        continue;
      }
      if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        // Handle operators: $in, $ne, $gte, $lte, $gt, $lt, $regex
        if ('$in' in val) {
          if (!val.$in.map(String).includes(String(item[key]))) return false;
        }
        if ('$ne' in val) {
          if (String(item[key]) === String(val.$ne)) return false;
        }
        if ('$gte' in val) {
          if (new Date(item[key]) < new Date(val.$gte)) return false;
        }
        if ('$lte' in val) {
          if (new Date(item[key]) > new Date(val.$lte)) return false;
        }
        if ('$gt' in val) {
          if (Number(item[key]) <= Number(val.$gt)) return false;
        }
        if ('$lt' in val) {
          if (Number(item[key]) >= Number(val.$lt)) return false;
        }
        if ('$regex' in val) {
          const re = new RegExp(val.$regex, val.$options || 'i');
          if (!re.test(String(item[key] || ''))) return false;
        }
      } else {
        if (key === '_id' || key === 'id') {
          if (String(item._id) !== String(val)) return false;
        } else if (String(item[key]) !== String(val)) {
          return false;
        }
      }
    }
    return true;
  }

  async find(filter = {}, sort = null, pagination = null) {
    if (!isUsingMemoryStore()) {
      try {
        let query = this.mongooseModel.find(filter);
        if (sort) query = query.sort(sort);
        if (pagination) {
          if (pagination.skip) query = query.skip(Number(pagination.skip));
          if (pagination.limit) query = query.limit(Number(pagination.limit));
        }
        return await query.lean();
      } catch (err) {
        // Fallback to memory if mongoose disconnects
      }
    }
    const collection = memoryStore.getCollection(this.collectionName);
    let results = collection.filter(item => this.matchesFilter(item, filter));
    if (sort) {
      const [field, dir] = Object.entries(sort)[0] || ['createdAt', -1];
      const direction = dir === -1 || dir === 'desc' ? -1 : 1;
      results.sort((a, b) => {
        const valA = a[field] ?? '';
        const valB = b[field] ?? '';
        if (valA < valB) return -1 * direction;
        if (valA > valB) return 1 * direction;
        return 0;
      });
    }
    if (pagination) {
      const skip = Number(pagination.skip) || 0;
      const limit = Number(pagination.limit) || results.length;
      results = results.slice(skip, skip + limit);
    }
    return JSON.parse(JSON.stringify(results));
  }

  async findOne(filter = {}) {
    if (!isUsingMemoryStore()) {
      try {
        return await this.mongooseModel.findOne(filter).lean();
      } catch (err) {}
    }
    const collection = memoryStore.getCollection(this.collectionName);
    const item = collection.find(i => this.matchesFilter(i, filter));
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  async findById(id) {
    if (!id) return null;
    if (!isUsingMemoryStore()) {
      try {
        return await this.mongooseModel.findById(id).lean();
      } catch (err) {}
    }
    const collection = memoryStore.getCollection(this.collectionName);
    const item = collection.find(i => String(i._id) === String(id));
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  async create(data) {
    if (!isUsingMemoryStore()) {
      try {
        const created = await this.mongooseModel.create(data);
        return created.toObject();
      } catch (err) {}
    }
    const collection = memoryStore.getCollection(this.collectionName);
    const newDoc = {
      isActive: data.isActive !== undefined ? data.isActive : true,
      ...data,
      _id: data._id || memoryStore.generateId(),
      createdAt: data.createdAt || new Date()
    };
    collection.push(newDoc);
    return JSON.parse(JSON.stringify(newDoc));
  }

  async insertMany(docs) {
    if (!isUsingMemoryStore()) {
      try {
        return await this.mongooseModel.insertMany(docs);
      } catch (err) {}
    }
    const createdList = [];
    for (const d of docs) {
      const item = await this.create(d);
      createdList.push(item);
    }
    return createdList;
  }

  async findByIdAndUpdate(id, updateData, options = { new: true }) {
    if (!isUsingMemoryStore()) {
      try {
        return await this.mongooseModel.findByIdAndUpdate(id, updateData, { new: true }).lean();
      } catch (err) {}
    }
    const collection = memoryStore.getCollection(this.collectionName);
    const index = collection.findIndex(i => String(i._id) === String(id));
    if (index === -1) return null;

    // Handle $inc or direct object update
    const current = collection[index];
    if (updateData.$inc) {
      for (const [k, v] of Object.entries(updateData.$inc)) {
        current[k] = (current[k] || 0) + v;
      }
      delete updateData.$inc;
    }
    if (updateData.$push) {
      for (const [k, v] of Object.entries(updateData.$push)) {
        if (!Array.isArray(current[k])) current[k] = [];
        current[k].push(v);
      }
      delete updateData.$push;
    }

    collection[index] = {
      ...current,
      ...updateData,
      updatedAt: new Date()
    };
    return JSON.parse(JSON.stringify(collection[index]));
  }

  async findByIdAndDelete(id) {
    if (!isUsingMemoryStore()) {
      try {
        return await this.mongooseModel.findByIdAndDelete(id).lean();
      } catch (err) {}
    }
    const collection = memoryStore.getCollection(this.collectionName);
    const index = collection.findIndex(i => String(i._id) === String(id));
    if (index === -1) return null;
    const deleted = collection.splice(index, 1)[0];
    return JSON.parse(JSON.stringify(deleted));
  }

  async countDocuments(filter = {}) {
    if (!isUsingMemoryStore()) {
      try {
        return await this.mongooseModel.countDocuments(filter);
      } catch (err) {}
    }
    const collection = memoryStore.getCollection(this.collectionName);
    return collection.filter(i => this.matchesFilter(i, filter)).length;
  }

  async deleteMany(filter = {}) {
    if (!isUsingMemoryStore()) {
      try {
        return await this.mongooseModel.deleteMany(filter);
      } catch (err) {}
    }
    const collection = memoryStore.getCollection(this.collectionName);
    const remaining = collection.filter(i => !this.matchesFilter(i, filter));
    const deletedCount = collection.length - remaining.length;
    memoryStore.collections[this.collectionName.toLowerCase()] = remaining;
    return { deletedCount };
  }
}

// Export repository singletons
module.exports = {
  User: new Repository('User', 'users'),
  Product: new Repository('Product', 'products'),
  Plan: new Repository('Plan', 'plans'),
  QuotationTemplate: new Repository('QuotationTemplate', 'quotationtemplates'),
  Subscription: new Repository('Subscription', 'subscriptions'),
  Discount: new Repository('Discount', 'discounts'),
  TaxRule: new Repository('TaxRule', 'taxrules'),
  Invoice: new Repository('Invoice', 'invoices'),
  Payment: new Repository('Payment', 'payments'),
  MongooseModels
};
