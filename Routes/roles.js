const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const { isAuth } = require("../middlewares/isAuth");
const { isInScope } = require("../middlewares/isInScope");

const Roles = require("../Models/roles");

router.post("/create", isAuth, isInScope("role-create"), (req, res) => {
  const { roleData } = req.body;
  const roleName = roleData.name;
  Roles.findOne({ name: roleName }, (err, doc) => {
    if (err) {
      console.log(err);
      res.status(400).send({ status: false, errors: [{ message: err }] });
    } else {
      if (doc) {
        res.send({
          status: false,
          errors: [{ message: "Same role already exists" }],
        });
      } else {
        const newRole = new Roles(roleData);
        newRole
          .save()
          .then((doc) => {
            res.status(200).send({ status: true, createdRole: doc });
          })
          .catch((err) => {
            console.log(err);
            res.status(400).send({ status: false, errors: [{ message: err }] });
          });
      }
    }
  });
});

router.get("/all", isAuth, isInScope("role-get"), (req, res) => {
  Roles.find({}, (err, docs) => {
    if (err) {
      console.log(err);
      res.status(400).send({ status: false, errors: [{ message: err }] });
    } else {
      res.status(200).send({ status: true, allRoles: docs });
    }
  });
});

const updateRolesAccToTypes = (roleName, roleId, update, cb) => {
  Roles.updateOne(
    { name: roleName, _id: mongoose.Types.ObjectId(roleId) },
    { [update.type]: update.value },
    cb
  );
}; 

router.put("/edit", isAuth, isInScope("role-edit"), (req, res) => {
  const { roleName, roleId, update } = req.body;
  updateRolesAccToTypes(roleName, roleId, update, (err, updatedDocs) => {
    if (err) {
      console.log(err);
      res.status(400).send({ status: false, errors: [{ message: err }] });
    } else {
      res.status(200).send({ status: true, updatedRoles: updatedDocs });
    }
  });
});

router.delete("/remove", isAuth, isInScope("role-edit"), (req, res) => {
  const { roleName, roleId } = req.body;
  Roles.deleteOne({ name: roleName, _id: mongoose.Types.ObjectId(roleId) })
    .then(() => {
      console.log("Deletion of role successful");
      res.status(200).send({ status: true });
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send({ status: false, errors: [{ message: err }] });
    });
});

module.exports = router;
