var express = require('express');
var router = express.Router();
var helpers = require('../helpers/utility')



module.exports = (db) => {

    router.get('/', function (req, res, next) {
        //console.log(req.session.user);

        //db.query('SELECT * FROM projects order by projectid', (err, response) => {
        db.query('SELECT * FROM members INNER JOIN users ON members.userid = users.userid INNER JOIN projects ON members.projectid = projects.projectid', (err, data) => {
            //console.log(data.rows);

            res.render('projects/projects', { title: 'Project Page', data: data.rows })
        })

    })




    //============================================================ ADD PROJECTS ====================================================//


    router.get('/add', function (req, res, next) {
        db.query(`SELECT * FROM users ORDER BY userid`, (err, data) => {
            res.render('projects/add', { title: 'Tambah Project', data: data.rows })
        })

    })


    router.post('/add', function (req, res, next) {
        //console.log(req.body);

        let sql = `select nextval('projects_projectid_seq') as nextid`;
        //console.log(sql);

        db.query(sql, (err, data) => {
            const projectid = data.rows[0].nextid;
            sql = `INSERT INTO projects(projectid,name) VALUES ('${projectid}', '${req.body.projectname}')`
            db.query(sql, (err) => {
                if (err) return res.send(err)
                if (typeof req.body.members == 'string') {
                    sql = `insert into members (projectid,userid) values (${projectid}, ${req.body.members})`
                } else {
                    sql = `Insert into members (projectid, userid) values ${req.body.members.map((item) => `(${projectid},${item})`).join(',')};`
                }
                //console.log(sql)
                db.query(sql, (err) => {
                    //console.log('wkwkwkwkwkw', sql);

                    res.redirect('/projects')
                });
            })
        })
    })


//=============================================================== DELETE PROJECTS ====================================================================//


    router.get('/delete/:id', function (req, res, next) {
        let id = req.params.id;
        db.query(`DELETE FROM members where projectid = ${id}`, (err) => {
            if (err) return res.send(err)
            db.query(`DELETE FROM projects where projectid = ${id}`, (err) => {
                if (err) return res.send(err)
                //console.log(`data berhasil di delete`);
                res.redirect('/projects');
            });
        });
    });


// ========================================== MEMBER =================================================//







    return router;

}


