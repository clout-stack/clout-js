/**
 * Simple EJS Page
 */
module.exports = {
    path: '/simple/ejs',
    method: 'all',
    description: 'Simple EJS Page',
    fn: function fn(req, resp, next) {
        resp.render('simple/index.ejs');
    }
};
