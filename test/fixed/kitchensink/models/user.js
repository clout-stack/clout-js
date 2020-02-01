const simpleModel = require('./simple');
const userDB = {};

class User {
    constructor(user) {
        Object.assign(this, user);
    }

    async save() {
        const instance = !this.id
            ? await simpleModel.create(this)
            : await simpleModel.getById(this.id);

        Object.assign(this, instance);
        userDB[this.id] = instance;

        return Promise.resolve(instance);
    }

    delete() {
        simpleModel.deleteById(this.id);
        userDB[this.id] = null;
        delete userDB[this.id];
        return Promise.resolve();
    }
}

module.exports = {
    list() {
        let list = Object.keys(userDB).map((id) => Object.assign(userDB[id], { id }));

        return Promise.resolve(list);
    },
    getById(userId) {
        return simpleModel.getById(userId)
            .then((info) => new User(info));
    },
    add(info) {
        return (new User(info)).save();
    }
};
