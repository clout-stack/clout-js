/**
 * Simple HBS Page
 */
module.exports = {
    path: '/simple/hbs',
    method: 'all',
    description: 'Simple EJS Page',
    fn: function fn(req, resp, next) {
        resp.render('simple/index.hbs', {
            pageTitle: 'HBS Page Title'
        });
    }
};
