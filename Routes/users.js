const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { body, validationResult, param } = require("express-validator");
const phone = require("phone");
const jwt = require("jsonwebtoken");

const Users = require("../Models/users");
const Roles = require("../Models/roles");

const { isAuth } = require("../middlewares/isAuth");
const { isInScope } = require("../middlewares/isInScope");

const secret = require("../config/keys.json").jwtSecret;

const router = express.Router();

const salt = 12;

//Does not check if the role is available or not
router.post(
  "/signup",
  [
    body("first_name")
      .isLength({ min: 2 })
      .withMessage("First name min 2 characters"),
    body("last_name")
      .isLength({ min: 2 })
      .withMessage("Last name min 2 characters"),
    body("email")
      .isEmail()
      .withMessage("Invalid email format")
      .normalizeEmail({ all_lowercase: true }),
    body("mobile").custom((phoneNo, { req }) => {
      const phoneArr = phone(phoneNo, "IN");
      if (phoneArr.length === 0) {
        throw new Error("Invalid phone number");
      } else {
        req.body.mobile = phoneArr[0];
        return true;
      }
    }),
    body("password")
      .isLength({ min: 5 })
      .withMessage("Password must be at least 5 characters"),
    body("roleId").isMongoId().withMessage("Wrong roleId format"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      res.status(400).send({ status: false, errors: errors });
    }

    const { first_name, last_name, email, mobile, password, roleId } = req.body;
    Users.findOne({ email: email }, (err, user) => {
      if (err) {
        console.log(err);
        res.status(400).send({ status: false, errors: [{ message: err }] });
      } else {
        if (user) {
          res.send({
            status: false,
            errors: [{ message: "user already exists" }],
          });
        } else {
          bcrypt.hash(password, salt, (err, hashedPassword) => {
            if (err) {
              console.log(err);
              res
                .status(400)
                .send({ status: false, errors: [{ message: err }] });
            } else {
              const newUserData = {
                first_name: first_name,
                last_name: last_name,
                email: email,
                mobile: mobile,
                password: hashedPassword,
                roleId: mongoose.Types.ObjectId(roleId),
              };

              Roles.findById(newUserData.roleId)
                .then((doc) => {
                  if (doc) {
                    Users.create(newUserData, (err, savedUser) => {
                      if (err) {
                        res
                          .status(400)
                          .send({ status: false, errors: [{ message: err }] });
                      } else {
                        console.log(savedUser);
                        res.status(200).send({ status: true });
                      }
                    });
                  } else {
                    res.send({
                      status: false,
                      errors: [
                        {
                          message: "Role with specified id does not exists",
                        },
                      ],
                    });
                  }
                })
                .catch((err) => {
                  console.log(err);
                  res.status(400).send({ status: false, errors: err });
                });
            }
          });
        }
      }
    });
  }
);

const generateJWT = (doc, cb) => {
  delete doc.password;
  jwt.sign(doc, secret, { expiresIn: "7d" }, (err, token) => {
    if (err) {
      console.log(err);
      cb(err, null);
    } else {
      cb(null, token);
    }
  });
};

router.post(
  "/signin",
  [
    body("email")
      .isEmail()
      .withMessage("Invalid email format")
      .normalizeEmail({ all_lowercase: true }),
    body("password")
      .isLength({ min: 5 })
      .withMessage("Password must be at least 5 characters"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      res.status(400).send({ status: false, errors: errors });
    }

    const { email, password } = req.body;

    Users.findOne({ email: email })
      .populate("roleId")
      .then((user) => {
        if (user) {
          bcrypt.compare(password, user.password, (err, isSame) => {
            if (err) {
              console.log(err);
              res
                .status(400)
                .send({ status: false, errors: [{ message: err }] });
            } else {
              if (isSame) {
                const { _doc } = user;
                generateJWT(_doc, (err, token) => {
                  if (err) {
                    res
                      .status(400)
                      .send({ status: false, errors: [{ message: err }] });
                  } else {
                    const content = {
                      data: {
                        ..._doc,
                        roleId: _doc.roleId._id,
                      },
                      token: token,
                    };
                    res.status(200).send({
                      status: true,
                      content: content,
                    });
                  }
                });
              } else {
                console.log(err);
                res.send({
                  status: false,
                  errors: [{ message: "Password/Email not correct" }],
                });
              }
            }
          });
        } else {
          res.status(400).send({
            status: false,
            errors: [{ message: "user have not created an account yet" }],
          });
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(400).send({ status: false, errors: [{ message: err }] });
      });
  }
);

router.get("/get", isAuth, isInScope('user-getall'), (req, res) => {
  Users.find({})
    .then((users) => {
      res.status(200).send({
        status: true,
        content: {
          data: users,
        },
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send({
        status: false,
        errors: [{ message: err }],
      });
    });
});

router.get(
  "/get/:id",
  isAuth,
  isInScope('user-get'),
  param("id", "Id is not a valid user id").isMongoId(),
  (req, res) => {
    const { id } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).send({
        status: false,
        errors: errors,
      });
    }
    Users.findById(mongoose.Types.ObjectId(id), (err, user) => {
      if (err) {
        console.log(err);
        res.status(400).send({
          status: false,
          errors: [{ message: err }],
        });
      } else {
        if (user) {
          res.status(200).send({ status: true, user: user });
        } else {
          res.send({
            status: false,
            errors: [{ message: "user not found" }],
          });
        }
      }
    });
  }
);

router.delete(
  "/delete/:id",
  isAuth,
  isInScope('user-remove'),
  param("id", "Id is not a valid user id").isMongoId(),
  (req, res) => {
    const { id } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).send({
        status: false,
        errors: errors,
      });
    }

    Users.findByIdAndDelete(mongoose.Types.ObjectId(id), (err, doc) => {
      if (err) {
        console.log(err);
        res.status(400).send({
          status: false,
          errors: [{ message: err }],
        });
      } else {
        if (doc) {
          res.status(200).send({ status: true, message: "doc deleted" });
        } else {
          res.send({
            status: false,
            errors: [
              {
                message: "No user with id found",
              },
            ],
          });
        }
      }
    });
  }
);

//The below function does not make sure that edited values are valid or not or if they are already present in the database.
router.patch(
  "/edit/:id",
  isAuth,
  isInScope('user-edit'),
  param("id", "Id is not a valid user id").isMongoId(),
  (req, res) => {
    const { id } = req.params;
    const { update } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).send({
        status: false,
        errors: errors,
      });
    }

    Users.findByIdAndUpdate(
      mongoose.Types.ObjectId(id),
      { [update.field]: update.value },
      { new: true },
      (err, updatedDoc) => {
        if (err) {
          console.log(err);
          res.status(400).send({
            status: false,
            errors: [{ message: err }],
          });
        } else {
          res.status(200).send({ status: true });
        }
      }
    );
  }
);

module.exports = router;
