const simpleModel = require('./simple');

class Product {
    constructor(product) {
        Object.assign(this, product);
    }

    async save() {
        const instance = !this.id
            ? await simpleModel.create(this)
            : await simpleModel.getById(this.id);

        Object.assign(this, instance);
        productModelMap[this.id] = instance;

        return Promise.resolve(instance);
    }

    delete() {
        simpleModel.deleteById(this.id);
        productModelMap[this.id] = null;
        delete productModelMap[this.id];
        return Promise.resolve();
    }
}

let productModelMap = {};

module.exports = {
    list() {
        let list = Object.keys(productModelMap).map((id) => Object.assign(productModelMap[id], { id }));

        return Promise.resolve(list);
    },
    getById(productId) {
        return simpleModel.getById(productId)
            .then((info) => new Product(info));
    },
    add(info) {
        return (new Product(info)).save();
    }
};
