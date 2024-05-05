#!/usr/bin/env node

var debug = require('debug')('rocketclub:server');
var http = require('http');

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var sqlite3 = require('sqlite3');
let db= new sqlite3.Database('./data.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {

    if (err && err.code == "SQLITE_CANTOPEN") {
        createDatabase();
        return;
    } else if (err) {
        console.log("Getting error " + err);
        exit(1);
    }
    createTables(db);
});

async function userLogin(user, pass) {

    const query = "SELECT * FROM users WHERE username = ? AND password = ?;";
    // Run the SELECT query with values for placeholders
    return await new Promise((resolve, reject) => {
        db.get(query, [user, pass], (err, row) => {
            if (err) {
                console.error(err.message);
                reject(err.message);
                return;
            }

            if (row) {
                console.log('User exists', row);
                resolve(row);
            } else {
                console.log('User/Password not found');
                resolve(false);
            }
        })
    });
}

async function registerUser(values) {
    const query = "insert into users (role, username, name, password, paid, reviewed, profile) values(0,?,?,?,false,false,null);";
    // Run the SELECT query with values for placeholders
    return await new Promise((resolve, reject) => {
        db.run(query, [values.user, values.name, values.password], (err, row) => {
            if (err) {
                console.error(err.message);
                resolve(false);
                return;
            }
            console.log("Account Created:", values.user)
            resolve({
                id: this.lastID,
                role: 0,
                username: values.user,
                name: values.name,
                password: values.password,
                paid: 0,
                reviewed: 0,
                profile: null
            });
        })
    });
}

async function newContact(values) {
    const query = "insert into contacts (name, email, reason, message, time) values (?,?, ?, ?, datetime());";
    // Run the SELECT query with values for placeholders
    return await new Promise((resolve, reject) => {
        db.get(query, [values.name, values.email, values.reason, values.message], (err) => {
            if (err) {
                console.error(err.message);
                resolve(false);
                return;
            }
            console.log("Inserted:", values.email)
            resolve(true);
        })
    });
}
async function getContacts() {
    const query = "select id, name, email, reason, message, time from contacts;";
    // Run the SELECT query with values for placeholders
    return await new Promise((resolve, reject) => {
        db.all(query, (err, rows) => {
            if (err) {
                console.error(err.message);
                resolve(false);
                return;
            }
            resolve(rows);
        })
    });
}


async function getUsers() {
    const query = "select id, role, username, name, reviewed, profile from users;";
    // Run the SELECT query with values for placeholders
    return await new Promise((resolve, reject) => {
        db.all(query, (err, rows) => {
            if (err) {
                console.error(err.message);
                resolve(false);
                return;
            }
            resolve(rows);
        })
    });
}

async function removeData(target, id) {
    if (target=="contacts"){
        table = "contacts";
    } else if (target == "users") {
        table="users";
    } else if (target == "activities") {
        table="activities";
    }else{
        return false;
    }
    let query = "DELETE FROM "+table+" WHERE id = ?;";
    // Run the SELECT query with values for placeholders
    return await new Promise((resolve, reject) => {
        db.run(query, [id], (err) => {
            if (err) {
                console.error(err.message);
                resolve(false);
            }
            resolve(true);
        })
    });
}

async function updateData(target, id, values) {
    if (target == "users") {
        query = "UPDATE users set role = ?, reviewed = ? where id =?;";
        params = [values.role, values.reviewed, id]
    } else if (target == "activities") {
        table="activities";
    }else{
        return false;
    }
    // Run the SELECT query with values for placeholders
    return await new Promise((resolve, reject) => {
        db.run(query, params, (err) => {
            if (err) {
                console.error(err.message);
                resolve(false);
            }
            resolve(true);
        })
    });
}


function createDatabase() {
    var newdb = new sqlite3.Database('data.db', (err) => {
        if (err) {
            console.log("Getting error " + err);
            exit(1);
        }
        createTables(newdb);
    });
}

function createTables(newdb) {
    newdb.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY,
        name text not null,
        email text not null,
        reason text not null,
        message text not null,
        time date not null
    );
    CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY,
        title text not null,
        body text not null,
        time date not null
    );
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        role int not null,
        username text not null UNIQUE,
        name text,
        password text not null,
        paid boolean not null,
        reviewed boolean not null,
        profile text
    );
    CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY,
        event_id int not null,
        user_id int not null,
        like boolean not null,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(event_id) REFERENCES activities(id)   
    );`
    );
}




var indexRouter = require('./routes/index');
var activitiesRouter = require('./routes/activities');
var contactusRouter = require('./routes/contactus');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("davidsWebsite"));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/', activitiesRouter);
app.use('/', contactusRouter);


app.get('/about.html', async function (req, res, next) {
    users = await getUsers();

    res.render('about', {logged: req.signedCookies['loginStatus'], users: users});
});

app.get('/officers.html', async function (req, res, next) {
    // res.send('respond with a resource');
    users = await getUsers();
    res.render('officers', {logged: req.signedCookies['loginStatus'], users: users});
});

/* post for login listing. */
app.post('/login', async function (req, res, next) {

    //Get the data
    let login = true;
    let values = {};
    try {
        if (req.body['goal'] == "register") {
            values = {
                user: req.body["newUser"],
                name: req.body["newName"],
                email: req.body["newEmail"],
                password: req.body["newSauce"]
            }
            login = false;
        } else if (req.body['goal'] == "login") {
            values = {
                user: req.body["user"],
                password: req.body["sauce"]
            }
        } else {
            throw new Error("Invalid option")
        }

    } catch (e) {
        res.json(
            {success: false,
                message: "Something went wrong"}
        )
    }
    // console.log(values)
    // Check the db
    let actStatus;
    if (login) {
        actStatus = await userLogin(values["user"], values["password"]);
    } else {
        actStatus = await registerUser(values);
    }
    // console.log(actStatus)

    //Return error or cookie and conformation
    if (actStatus) {
        res.cookie("loginStatus",actStatus, { maxAge: 900000, httpOnly: true, signed: true})
        res.json({
            success: true,
            message: "Login Successful"
        });
    } else {
        res.json({
            success: false,
            message: "Invalid username or password"
        });
    }

});


app.post('/logout', (req, res) => {
    // Clear the 'loginStatus' cookie
    res.clearCookie('loginStatus');
    res.json({ success: true, message: 'Logout successful' });
});

app.post('/contactus.html', (req, res) => {
    values = {
        name: req.body.name,
        email: req.body.email,
        reason: req.body.reason,
        message: req.body.message
    }
    newContact(values)
    res.render('contactus',{logged: req.signedCookies['loginStatus']});
});

app.post('/values', async (req, res) => {

    if (req.signedCookies['loginStatus'] && req.signedCookies['loginStatus'].role>0){
        response = await removeData(req.body.target, req.body.id);

    res.json({
        success: response
    })
    } else{
        res.json({
            success: false
        })
    }
});

app.post('/update', async (req, res) => {

    if (req.signedCookies['loginStatus'] && req.signedCookies['loginStatus'].role>1){
        response = await updateData(req.body.target, req.body.id, req.body.values);

        res.json({
            success: response
        })
    } else{
        res.json({
            success: false
        })
    }
});

app.get('/dashboard.html', async (req, res) => {
    if (!req.signedCookies['loginStatus']) {
        res.redirect('/')
    }
    contactDetails = await getContacts();
    userDetails = await getUsers();
    res.render('dashboard', {logged: req.signedCookies['loginStatus'], contacts: contactDetails, users: userDetails})
})

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

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}

