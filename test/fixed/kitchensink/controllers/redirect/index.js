module.exports = {
    path: '/redirect/google',
    method: 'get',
    description: `
        Controller Example to demonstrate redirections
    `,
    fn: (req, resp) => {
        return resp.redirect('https://google.com');
    }
};
