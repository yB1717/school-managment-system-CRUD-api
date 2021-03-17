const express = require("express");
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");

const User = require("../Models/users");
const School = require("../Models/schools");
const Profile = require("../Models/profiles");

const { isAuth } = require("../middlewares/isAuth");
const { isInScope } = require("../middlewares/isInScope");

const router = express.Router();

router.post(
  "/create",
  isAuth,
  isInScope("profile-create"),
  [
    body("first_name")
      .isString()
      .withMessage("First name must be a string")
      .isLength({ min: 2 })
      .withMessage("First name min 2 characters"),
    body("last_name")
      .isString()
      .withMessage("Last name must be a string")
      .isLength({ min: 2 })
      .withMessage("Last name min 2 characters"),
    body("classroom")
      .isString()
      .withMessage("classroom must be a string")
      .isLength({ min: 2 })
      .withMessage("Classroom must be min 3 characters"),
    body("userId", "userid is invalid").isMongoId(),
    body("schoolId", "userid is invalid").isMongoId(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      res.status(400).send({ status: false, errors: errors });
    }

    let { first_name, last_name, classroom, userId, schoolId } = req.body;
    userId = mongoose.Types.ObjectId(userId);
    schoolId = mongoose.Types.ObjectId(schoolId);
    Profile.findOne({ userId: userId })
      .then((profile) => {
        if (profile) {
          res.send({ status: false, errors: "Same profile exists" });
        } else {
          User.findById(userId)
            .then((user) => {
              if (user) {
                School.findById(schoolId)
                  .then((school) => {
                    if (school) {
                      const newProfile = {
                        first_name: first_name,
                        last_name: last_name,
                        classroom: classroom,
                        userId: userId,
                        schoolId: schoolId,
                      };

                      Profile.create(newProfile)
                        .then((doc) => {
                          res
                            .status(200)
                            .send({ status: true, savedProfile: doc });
                        })
                        .catch((err) => {
                          console.log(err);
                          res.status(400).send({
                            status: false,
                            errors: [{ message: err }],
                          });
                        });
                    } else {
                      res.status(400).send({
                        status: false,
                        errors: [
                          { message: "no such school with schoolId exists" },
                        ],
                      });
                    }
                  })
                  .catch((err) => {
                    console.log(err);
                    res
                      .status(400)
                      .send({ status: false, errors: [{ message: err }] });
                  });
              } else {
                res.status(400).send({
                  status: false,
                  errors: [{ message: "user need to make an account first" }],
                });
              }
            })
            .catch((err) => {
              console.log(err);
              res
                .status(400)
                .send({ status: false, errors: [{ message: err }] });
            });
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(400).send({ status: false, errors: [{ message: err }] });
      });
  }
);

router.get("/get", isAuth, isInScope("profile-get"), (req, res) => {
  Profile.find({})
    .then((profiles) => {
      res.status(200).send({
        status: true,
        content: {
          data: profiles,
        },
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send({ status: false, errors: [{ message: err }] });
    });
});

module.exports = router;
