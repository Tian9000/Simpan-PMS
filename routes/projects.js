const express = require('express');
const router = express.Router();
//const helpers = require('../helpers/utility')
const navs = 1;
var moment = require('moment');



module.exports = (db) => {

    // router.get('/',  (req, res, next) => {
    //     //console.log(req.session.user);

    //     //db.query('SELECT * FROM projects order by projectid', (err, response) => {
    //     db.query('SELECT * FROM members INNER JOIN users ON members.userid = users.userid INNER JOIN projects ON members.projectid = projects.projectid', (err, data) => {
    //         //console.log(data.rows);

    //         res.render('projects/projects', {
    //             title: 'Project Page',
    //             data: data.rows,

    //         })
    //     })

    // })

    router.get('/', (req, res) => {
        let params = []
        let searching = false

        if (req.query.checkid && req.query.formid) {
            params.push(`projects.projectid = ${req.query.formid}`)
            searching = true
        }
        if (req.query.checkname && req.query.formname) {
            params.push(`projects.name ilike '%${req.query.formname}%'`)
            searching = true
        }
        if (req.query.checkmember && req.query.formmember) {
            params.push(`CONCAT(users.firstname,' ',users.lastname) = '${req.query.formmember}'`)
            searching = true
        }

        // menampilkan filter
        let sql = `SELECT * FROM members INNER JOIN users ON members.userid = users.userid INNER JOIN projects ON members.projectid = projects.projectid`

        if (searching) {
            sql += ` where ${params.join(' and ')}`
        }

        sql += ` order by projects.projectid`
        //console.log(sql);

        // menampilkan user di formmember
        let sqluser = `SELECT userid, concat(firstname, ' ' ,lastname) as fullname
    FROM users`
        // menampilkan nama projects
        let sqlproject = `SELECT DISTINCT name from projects`
       // db.query(`SELECT optionproject FROM users WHERE userid = ${req.session.user.userid}`, (err, response3) => {
            db.query(sql, (err, data) => {
                db.query(sqluser, (err, userdata) => {
                    db.query(sqlproject, (err, projectdata) => {

                        res.render('projects/projects', {
                            users: userdata.rows,
                            data: data.rows,
                            query: req.query,
                            projects: projectdata.rows,
                            //projectoption: JSON.parse(response3.rows[0].projectoption)
                        })
                    })
                });
            });
        //})
    })




    //=================================================== OPTION ==============================================//
    router.post('/membersoption/:projectid',  (req, res) => {
        // console.log(req.session.user);

        let sql = `UPDATE users SET memberoption = '${JSON.stringify(req.body)}' WHERE userid = ${req.session.user.userid}`

        // console.log(sql);
        db.query(sql, (err, rows) => {
            res.redirect(`/projects/members/${req.params.projectid}`)
        });
    })




    //============================================================ ADD PROJECTS ====================================================//


    router.get('/add', function (req, res, next) {
        db.query(`SELECT * FROM users ORDER BY userid`, (err, data) => {
            res.render('projects/add', {
                title: 'Tambah Project',
                data: data.rows
            })
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
                    db.query(`UPDATE members SET role = subquery.position FROM(SELECT userid,position from users) AS subquery WHERE members.userid =subquery.userid`)
                    if (err) return res.send(err)
                    res.redirect('/projects')
                })
            })
        })
    })


    //=============================================================== DELETE PROJECTS ====================================================================//


    router.get('/delete/:id',  (req, res, next) => {
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

    //======================================= EDIT PROJECT ==================================================//

    router.get('/edit/:projectid', (req, res, next) => {
        let projectid = req.params.projectid;
        db.query(`SELECT * FROM projects where projectid = ${projectid}`, (err, projectData) => {
            if (err) return res.send(err)
            db.query(`SELECT userid FROM members where projectid = ${projectid}`, (err, memberData) => {
                if (err) return res.send(err)
                db.query('select userid, firstname, lastname, position from users ORDER BY userid', (err, userData) => {
                    if (err) return res.send(err)
                    res.render('projects/edit', {
                        project: projectData.rows[0],
                        members: memberData.rows.map(item => item.userid),
                        users: userData.rows,
                        projectid
                    })
                })
            })
        });
    });



    //============================================== OVERVIEW =================================================== //

    router.get('/overview/:projectid', (req, res) => {
        let sidebar = 1;
        let id = req.params.projectid;
        let url = req.url

        let sqlBug = `SELECT COUNT(tracker), (SELECT COUNT(*) FROM issues WHERE tracker ='bug' AND projectid = ${id} AND status ='closed')
AS closed FROM issues WHERE tracker = 'bug' AND projectid = ${id} AND status != 'closed'`
        let sqlFeature = `SELECT COUNT(tracker), (SELECT COUNT(*) FROM issues WHERE tracker ='feature' AND projectid = ${id} AND status ='closed')
AS closed FROM issues WHERE tracker = 'feature' AND projectid = ${id} AND status != 'closed'`
        let sqlSupport = `SELECT COUNT(tracker), (SELECT COUNT(*) FROM issues WHERE tracker ='support' AND projectid = ${id} AND status ='closed')
AS closed FROM issues WHERE tracker = 'support' AND projectid = ${id} AND status != 'closed'`

        db.query(sqlFeature, (err, rowsFeature) => {
            db.query(sqlBug, (err, rowsBug) => {
                db.query(sqlSupport, (err, rowsSupport) => {
                    db.query(`SELECT users.firstname, users.lastname FROM users INNER JOIN members ON users.userid = members.userid WHERE projectid = ${id}`, (err, rows) => {
                        res.render('projects/overview/view', {
                            title: 'overview',
                            data: rows.rows,
                            id,
                            url,
                            navs,
                            sidebar,
                            tracker: {
                                bug: rowsBug,
                                support: rowsSupport,
                                feature: rowsFeature
                            }
                        });
                    });
                })
            })
        });
    })


    //=============================================== MEMBERS ================================================== //

    // router.get('/members/:projectid', (req, res) => {
    //     let sidebar = 2;
    //     let id = req.params.projectid;
    //     let url = req.url

    //     db.query(`SELECT users.firstname,users.userid, users.lastname, members.id, members.role FROM users INNER JOIN members ON users.userid = members.userid INNER JOIN projects ON projects.projectid = members.projectid WHERE projects.projectid = ${id}`
    //     , (err, data) => {

    //         res.render('projects/members/members', {
    //             title: 'Members Page',
    //             data: data.rows,
    //             id,
    //             url,
    //             navs,
    //             sidebar
    //         })
    //     })
    // })

    router.get('/members/:projectid', (req, res) => {
        let sidebar = 2
        let id = req.params.projectid
        let temp = []
        let searching = false
        // console.log(req.query.checkname2);
        // console.log('========', req.query.formname2);

        if (req.query.checkid2 && req.query.formid2) {
            temp.push(`members.id = ${req.query.formid2}`)
            searching = true
        }
        if (req.query.checkname2 && req.query.formname2) {
            temp.push(`members.userid ilike '%${req.query.formname2}%' `)
            searching = true
        }
        if (req.query.checkposition2 && req.query.formposition2) {
            temp.push(`members.role like '${req.query.formposition2}'`)
            searching = true
        }

        let sqluser = `SELECT distinct members.userid,users.firstname, users.lastname from members left join users on members.userid = users.userid`
        let sql = `SELECT users.firstname,users.userid, users.lastname, members.id, members.role FROM users INNER JOIN members ON users.userid = members.userid INNER JOIN projects ON projects.projectid = members.projectid WHERE projects.projectid = ${id}`
        // console.log(sql);

        let sqlposition = `SELECT DISTINCT position FROM users`

        if (searching) {
            sql += ` AND ${temp.join(' and ')}`
        }
        db.query(sql, (err, data) => {
            db.query(sqlposition, (err, roledata) => {
                db.query(sqluser, (err, user) => {
                    res.render('projects/members/members', {
                        data: data.rows,
                        users: user.rows,
                        role: roledata.rows,
                        sidebar,
                        id,
                        query: req.query
                    })
                })
            })
        })
    });




    // ========================================== Add Members ========================================== //

    router.get('/members/:projectid/add', (req, res) => {
        let sidebar = 2
        let id = req.params.projectid;

        let sql2 = `SELECT userid, concat(firstname,' ', lastname) as fullname, position from users  WHERE userid NOT IN (
          SELECT userid FROM members WHERE projectid = ${id})`
        // console.log(sql2);

        let sql3 = `SELECT DISTINCT position FROM users`
        db.query(sql2, (err, rows2) => {
            // console.log(rows2.rows[0].fullname);

            db.query(sql3, (err, rows3) => {
                // console.log(sql3);
                res.render('projects/members/add', {
                    title: 'overview',
                    data2: rows2.rows,
                    role: rows3.rows,
                    id,
                    navs,
                    sidebar
                });
            })
        })

    })

    router.post('/members/:projectid/add', (req, res) => {
        let sql = `INSERT INTO members (userid, role, projectid) VALUES (${req.body.user}, '${req.body.role}',${req.params.projectid})`

        db.query(sql, (err, rows) => {
            res.redirect(`/projects/members/${req.params.projectid}`)
        });
    });



    // ============================================== Edit Members ===================================== //

    router.get('/members/:projectid/edit/:mid', (req, res) => {
        let id = req.params.projectid
        let sidebar = 2

        let sql = `SELECT users.firstname, members.id, members.role FROM users INNER JOIN members ON users.userid = members.userid WHERE 
        members.projectid = ${id} AND members.id = ${req.params.mid}`

        let sql2 = `SELECT DISTINCT position FROM users WHERE position NOT IN (
            SELECT role FROM members WHERE id = ${req.params.mid})`

        db.query(sql, (err, rows1) => {
            // console.log(rows1);
            db.query(sql2, (err, rows2) => {
                // console.log(rows2.rows);
                res.render('projects/members/edit', {
                    query: req.query,
                    data: rows1.rows[0],
                    data2: rows2.rows,
                    navs,
                    sidebar,
                    id
                });
            })
        })
    })


    router.post('/members/:projectid/edit/:mid', (req, res) => {
        let sql = `UPDATE members SET role = '${req.body.member}' WHERE projectid = ${req.params.projectid} AND id = ${req.params.mid}`

        db.query(sql, (err, rows) => {
            res.redirect(`/projects/members/${req.params.projectid}`)
        })
    });















    // ============================================= Delete Members ===================================== //

    router.get('/members/:projectid/delete/:mid', (req, res, next) => {
        db.query(`DELETE FROM members WHERE projectid = ${req.params.projectid} AND id = ${req.params.mid}`, (err, response) => {
            res.redirect(`/projects/members/${req.params.projectid}`)
        })
    });

    // ============================================= Issues ======================================== //

    router.get('/issues/:projectid', (req, res) => {
        let sidebar = 3
        let id = req.params.projectid;

        db.query('select issuesid, subject, tracker, status from issues', (err, data) => {

            res.render('projects/issues/issues', {
                title: 'Issues Page',
                data: data.rows,
                sidebar,
                id: id
            })
        })
    })

    // =============================================== Add Issue ======================================//

    router.get('/issues/:projectid/add', (req, res) => {
        let sidebar = 3
        let id = req.params.projectid;

        let sql2 = `SELECT * FROM users`

        db.query(sql2, (err, rows2) => {

            res.render('projects/issues/add', {
                title: 'Issues',
                id,
                navs,
                sidebar,
                data: rows2.rows
            });
        })
    });




    // ============================================= Activity ========================================== //

    // router.get('/activity/:projectid', helpers.isLoggedIn, (req, res) => {

    //     res.render('projects/activity/view', {

    //         title: 'activity',
    //     })
    // })

    router.get('/activity/:projectid', (req, res) => {
        let sidebar = 4;
        let id = req.params.projectid;

        let dayNow = moment().format('YYYY-MM-DD HH:mm:ss'); //now
        let lastSevenDay = moment().subtract(7, 'days').format('YYYY-MM-DD HH:mm:ss')

        let sql = `SELECT * FROM activity WHERE time >= timestamp '${lastSevenDay}' AND time < timestamp '${dayNow}'`
        // console.log(sql);

        // var startdate = moment().subtract(1, "days").format("DD-MM-YYYY HH:mm:ss");
        // console.log(moment().subtract(1, "days").format("dddd"));

        db.query(sql, (err, rows) => {
            res.render('projects/activity/activity', {
                title: 'activity',
                id,
                navs,
                sidebar,
                day: {
                    dayNow,
                    lastSevenDay
                },
                moment,
                data: rows.rows,

            });
        })
    });





    return router;

}