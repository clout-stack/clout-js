/**
 * Simple Clout Model using memory store
 */
let datastore = [];
let index = 0;

module.exports = {
    list() {
        let store = datastore.filter((item) => !item.deleted);
        return Promise.resolve(store);
    },

    getById(id) {
        let store = datastore.filter((item) => !item.deleted);
        let item = store.find((item) => item.id == id);

        if (!item) {
            return Promise.reject('not found');
        }

        return Promise.resolve(item);
    },

    create(_item) {
        index = index + 1;

        let item = Object.assign({}, _item, {id: index});
        datastore.push(item);

        return Promise.resolve(item);
    },

    deleteById(id) {
        let store = datastore.filter((item) => !item.deleted);
        let itemIndex = store.findIndex((item) => item.id == id);

        if (itemIndex === -1) {
            return Promise.reject('not found');
        }

        store[itemIndex].deleted = true;

        return Promise.resolve(store[itemIndex]);
    }
};
