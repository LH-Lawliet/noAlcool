const mysql = require('mysql');
const bcrypt = require('bcrypt');
const config = require('../config.json')
var con = mysql.createConnection({
    host: config.mysqlHost,
    user: config.mysqlUser,
    password: config.mysqlpass,
    insecureAuth: true
});

let self = module.exports = {
    initDB() {
        con.connect(function (err) {
            if (err) throw err;
            console.log("Connected to sql database!");

            con.query("CREATE DATABASE IF NOT EXISTS clodo", function (err, result) {
                if (err) throw err;
                con.query("USE clodo;")
                if (result.warningCount == 0) {
                    console.log("New database created");
                    var sql = "CREATE TABLE alcool (id INT(32) NOT NULL AUTO_INCREMENT, creator INT(32) NOT NULL, name VARCHAR(255) NOT NULL COLLATE 'utf8_general_ci', alcoolRatio DOUBLE(32,2) NOT NULL, volume DOUBLE(32,2) NOT NULL, price DOUBLE(32,2) NOT NULL, category VARCHAR(255) NOT NULL COLLATE 'utf8_general_ci', source TEXT COLLATE 'utf8_general_ci', PRIMARY KEY(id));";
                    con.query(sql, function (err, result) {
                        if (err) throw err;
                        console.log("alcool table created");
                    });

                    sql = "CREATE TABLE request (id INT(32) NOT NULL AUTO_INCREMENT, creator INT(32) NOT NULL, name VARCHAR(255) NOT NULL COLLATE 'utf8_general_ci', alcoolRatio DOUBLE(32,2) NOT NULL, volume DOUBLE(32,2) NOT NULL, price DOUBLE(32,2) NOT NULL, category VARCHAR(255) NOT NULL COLLATE 'utf8_general_ci', source TEXT COLLATE 'utf8_general_ci', PRIMARY KEY(id));";
                    con.query(sql, function (err, result) {
                        if (err) throw err;
                        console.log("request table created");
                    });

                    sql = "CREATE TABLE users (id INT NOT NULL AUTO_INCREMENT,username VARCHAR(255) NOT NULL,email VARCHAR(255) NOT NULL,password VARCHAR(255) NOT NULL,token VARCHAR(255), admin INT NOT NULL, PRIMARY KEY(id));";
                    con.query(sql, function (err, result) {
                        if (err) throw err;
                        console.log("users table created");

                        console.log("Database is now setup")
                    });
                } else {
                    console.log("Perfect the database is already setup");
                };
            });
        });
    },

    getList(data, callback) {
        let query = "SELECT * FROM alcool"
        if (data.category) {
            query+= " WHERE category = ?"
        }
        query+= ";"

        con.query(query, [data.category], function (err, result) {
            if (err) throw err;
            console.log(result);
            callback(result)
        });

    },

    checkToken(token, callback) {
        let query = "SELECT id FROM users WHERE token = ?;"

        con.query(query, [token], function (err, result) {
            if (err) throw err;
            if (result[0]) {
                callback(result[0].id)
            } else {
                callback(false)
            }        
        });
    },

    addAlcool(data, callback) {
        self.checkToken(data.token, function (userId) {
            if (userId) {
                con.query("INSERT INTO request (name, creator, alcoolRatio, volume, price, category, source) VALUES (?,?,?,?,?,?,?)", [data.alcoolName, userId, data.alcoolRatio, data.volume, data.price, data.category, data.source], function (err, result) {
                    if (err) throw err;
                    if (callback) {
                        callback()
                    }
                });
            } else {
                console.log("WRONG TOKEN GIVEN")
            }
        })
    },

    registerUser(data, callback) {
        var sql = 'SELECT * FROM users WHERE username = ? OR username = ? OR email = ? OR email = ?'
        con.query(sql, [data.username, data.email, data.username, data.email], function (err, result1) {
            if (err) throw err;
            console.log(result1, result1.length)
            if (result1.length == 0) {
                bcrypt.genSalt(10, function (err, salt) {
                    bcrypt.hash(data.password, salt, function (err, hashedPass) {
                        bcrypt.genSalt(50, function (err, token) {
                            var sql2 = 'INSERT INTO users (username, email, password, token, admin) VALUES (?,?,?,?,?)'
                            con.query(sql2, [data.username, data.email, hashedPass, token, 0], function (err, result2) {
                                if (err) throw err;
                                callback({username:data.username, admin:0, token:token})
                            });
                        })
                    })
                })
            } else {
                callback("USER ALREADY EXIST")
            }
        });
    },


    tryConnect(data, callback) {
        var sql = 'SELECT username, password, admin FROM users WHERE username = ? or email = ?'
        con.query(sql, [data.username, data.username], function (err, result) {
            if (err) throw err;
            console.log(result, result.length)
            if (result.length == 1) {
                var hashedPass = result[0].password
                bcrypt.compare(data.password, hashedPass, function (err, isPasswordMatch) {
                    console.log("password match : "+isPasswordMatch)
                    if (isPasswordMatch) {
                        sql = 'UPDATE users SET token = ? WHERE username = ? or email = ?'
                        bcrypt.genSalt(50, function (err, token) {
                            con.query(sql, [token, data.username, data.username], function (err, result2) {
                                if (err) throw err;
                                console.log("token is now : "+token)
                                callback({username:result[0].username, admin:result[0].admin, token:token})
                            })
                        })
                    } else {
                        callback("WRONG PASS")
                    }
                })
            } else {
                callback("NO USER FINDED")
            }
        })
    }
};


