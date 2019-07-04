
var express = require('express');
var router = express.Router();
var helpers = require ('../helpers/utility')

module.exports = function (db) {

  // ========== LOGIN ==========
 
  router.get('/', function (req, res, next) {
    res.render('login', { loginMessage: req.flash('loginMessage') });
  });
 
  router.post('/', function (req, res, next) {
 
    let emails = req.body.email;
    let passwords = req.body.password;
 
    db.query(`SELECT * FROM users where email='${emails}' and password='${passwords}'`, (err, data) => {
      if (err) return res.send(err)
      if (data.rows.length == 0) {
        req.flash('loginMessage', 'Email atau Password Salah');
        res.redirect("/");
 
      } else {
        req.session.status = data.rows[0].status
        req.session.user = data.rows[0].userid;
        res.redirect("/projects");
      }
    })
  });
 
  //router.get('/logout', function (req, res, next) {
    //req.session.destroy(() => {
      //res.redirect('/')
    //})
  //})
  
  return router;
 };



// module.exports = (db) => {

//   /* GET home page. */
//   router.get('/', function (req, res, next) {
//     res.render('login', { title: 'login' });
//   });


//   router.post('/',  function (req, res, next) {
//     db.query('SELECT * FROM users WHERE email=$1 And password=$2', [req.body.email, req.body.password], (err, response) => {
//       if (response.rows.length > 0) {
//         req.session.user = response.rows[0]
//         console.log(req.session.user);
        
//         res.redirect('/projects')

//       }else {
//         res.redirect('/')
//       }


//     })
//   })


//   return router;
// }







