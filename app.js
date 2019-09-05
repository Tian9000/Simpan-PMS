const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session')
const flash = require ('connect-flash');



// var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');

const app = express();


const { Pool, Client } = require('pg')

const pool = new Pool({ 
  user: 'cristian',
  host: 'localhost',
  database: 'PMS',
  password: '12345',
  port: 5432,
 })

const loginRouter = require('./routes/login')(pool);
const projectsRouter = require('./routes/projects')(pool);
const profileRouter = require('./routes/profile')(pool);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret :"rahasia",
  resave: false,
  saveUninitialized: true

}));
app.use(flash());


app.use('/', loginRouter);
app.use('/projects', projectsRouter);
app.use('/profile', profileRouter)
//app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
