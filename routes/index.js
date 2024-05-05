var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get(['/',"/index.html"], function (req, res, next) {
    // res.send('respond with a resource');
    res.render('index', {logged: req.signedCookies['loginStatus']});
});

module.exports = router;
