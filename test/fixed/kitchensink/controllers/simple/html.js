/**
 * Simple HTML Page
 */
module.exports = {
    path: '/simple/html',
    method: 'all',
    description: 'Simple EJS Page',
    fn: function fn(req, resp, next) {
        resp.render('simple/index.html');
    }
};
