var express = require('express');
var router = express.Router();
var helpers = require('../helpers/utility')

module.exports = function (db) {

    router.get('/', helpers.isLoggedIn , function (req, res, next) {
        //console.log('terkoneksi');
        db.query(`SELECT * from users where userid = ${req.session.user}`, (err, data) => {
            //console.log(data.rows);
            if (err) {
                console.log('aaaaaaaaaaaaaaaaaa', data);
                
                console.log(err);
            }
            res.render('profile/profile', { data: data.rows[0] })
        })
    })

    

    return router;
};





// SELECT * FROM members INNER JOIN users ON members.users id INNER JOIN projects ON members.projectid = projects.projectid;