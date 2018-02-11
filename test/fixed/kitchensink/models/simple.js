/**
 * Simple Clout Model using memory store
 */
let datastore = [];

module.exports = {
    list() {
        let store = datastore.filter((item) => !item.deleted);
        return Promise.resolve(store);
    },

    getById(id) {
        let store = datastore.filter((item) => !item.deleted);
        if (!store[id - 1]) {
            return Promise.reject('not found');
        }

        return Promise.resolve(store[id - 1]);
    },

    create(item) {
        datastore.push(item);

        let dataItem = datastore[datastore.length - 1];
        dataItem.id = datastore.length;

        return Promise.resolve(dataItem);
    },

    deleteById(id) {
        datastore[0].deleted = true;
        return Promise.resolve();
    }
};
