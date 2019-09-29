const express = require('express');
const bodyParser = require('body-parser');
var authenticate = require('../authenticate');
const favRouter = express.Router();
var cors = require('./cors');
const Fav = require('../models/favourites');
require('../models/dishes');

favRouter.use(bodyParser.json());

favRouter.route('/').options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Fav.find({ "user": req.user._id }) //for partiular user
            .populate('user')  //populating user
            .populate('dishes.dish')  //populating dishes
            .then((fav) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(fav);
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Fav.find({ "user": req.user._id }).then((favDoc) => {
            if (favDoc.length == 0) {

                Fav.create({ "user": req.user._id, "dishes": req.body })//creating the favourite list
                    .then((fav) => {
                        console.log('Fav list Created ', fav);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(fav);
                    }, (err) => next(err))
                    .catch((err) => next(err));
            } else {
                console.log('dishes' + favDoc)
                if (favDoc[0].dishes != null) {
                    favDoc[0].dishes = favDoc[0].dishes.concat(req.body); //concatenating the list
                    console.log(favDoc)
                    favDoc[0].save();
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favDoc);

                } else {
                    req.body.user = req.user._id;
                    Fav.create(req.body)
                        .then((fav) => {
                            console.log('Fav list Created ', fav);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(fav);
                        }, (err) => next(err))
                        .catch((err) => next(err));
                }
            }
        });
    })

    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Fav.remove({ "user": req.user._id }) //deleting particular user's favourite list
            .then((resp) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(resp);
            }, (err) => next(err))
            .catch((err) => next(err));
    });


favRouter.route('/:dishId')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })

    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Fav.find({ "user": req.user._id }).then((favDoc) => {
            if (favDoc[0].dishes.find(element => element._id == req.params.dishId) == null) {  //if already exists
                favDoc[0].dishes.push(req.params.dishId);
                console.log(favDoc)
                favDoc[0].save();
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favDoc);
            } else {
                err = new Error('Dish ' + req.params.dishId + ' already exists');
                err.status = 404;
                return next(err);
            }


        });
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => { //deleting thro params
        Fav.find({ "user": req.user._id }).then((favDoc) => {
            console.log(favDoc[0])
            favDoc[0].dishes.remove(req.params.dishId);
            console.log(favDoc)
            favDoc[0].save();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favDoc);

        });
    })


module.exports = favRouter;