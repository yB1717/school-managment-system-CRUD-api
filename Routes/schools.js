const express = require("express");
const mongoose = require("mongoose");
const { body, validationResult, param } = require("express-validator");

const School = require("../Models/schools");
const Profile = require("../Models/profiles");

const { isAuth } = require("../middlewares/isAuth");
const { isInScope } = require("../middlewares/isInScope");

const router = express.Router();

router.post(
  "/create",
  isAuth,
  isInScope("school-create"),
  [
    body(
      "public_id",
      "public_id must be min 2 characters and max 7 chracters"
    ).isLength({ min: 2, max: 10 }),
    body("name", "name must be min 2 characters").isLength({ min: 2 }),
    body("city", "city must be min 2 characters").isLength({ min: 2 }),
    body("state", "state must be min 2 characters").isLength({ min: 2 }),
    body("country", "country must be min 2 characters").isLength({ min: 2 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).send({
        status: false,
        errors,
      });
    } else {
      const { public_id, name, city, state, country } = req.body;
      School.findOne({ public_id: public_id })
        .then((school) => {
          if (school) {
            res.send({
              status: false,
              errors: [{ message: "School with the same id exists" }],
            });
          } else {
            const newSchool = {
              public_id: public_id,
              name: name,
              city: city,
              state: state,
              country: country,
            };

            School.create(newSchool, (err, savedSchool) => {
              if (err) {
                console.log(err);
                res.send({
                  status: false,
                  errors: [{ message: "new school doc cannot be created" }],
                });
              } else {
                res
                  .status(200)
                  .send({ status: true, savedSchool: savedSchool });
              }
            });
          }
        })
        .catch((err) => {
          console.log(err);
          res.status(400).send({
            status: false,
            errors: [
              {
                message: err,
              },
            ],
          });
        });
    }
  }
);

router.get("/get", isAuth, isInScope("school-get"), (req, res) => {
  School.find({})
    .then((schools) => {
      res.status(200).send({
        status: true,
        content: {
          data: schools,
        },
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send({
        status: false,
        errors: [
          {
            message: err,
          },
        ],
      });
    });
});

// middleware for getting all the students of certain school.
router.get("/:id/students", isAuth, isInScope('getall-school-students'), (req, res) => {
  let { id } = req.params;
  id = mongoose.Types.ObjectId(id);

  School.findById(id)
    .select("_id public_id name city state country createdAt updatedAt")
    .then((school) => {
      if (school) {
        Profile.find({ schoolId: id })
          .then((profiles) => {
            const schoolWithStudentsData = {
              school,
              students: profiles,
            };
            res.status(200).send({
              status: true,
              content: {
                data: schoolWithStudentsData,
              },
            });
          })
          .catch((err) => {
            console.log(err);
            res.status(400).send({
              status: false,
              errors: [
                {
                  message: err,
                },
              ],
            });
          });
      } else {
        res.send({ status: false, errors: "No school with id found" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send({
        status: false,
        errors: [
          {
            message: err,
          },
        ],
      });
    });
});

// does not check validation of the field updated.
router.patch(
  "/edit/:id",
  isInScope('school-edit'),
  isAuth,
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

    School.findByIdAndUpdate(
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
          res.status(200).send({ status: true, updatedDoc: updatedDoc });
        }
      }
    );
  }
);

module.exports = router;
