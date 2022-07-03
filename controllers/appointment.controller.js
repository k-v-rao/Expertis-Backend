const appointmentServices = require("../services/appointment.services");

exports.bookAppointment = (req, res, next) => {
  console.log(req.body);

  appointmentServices.bookAppointment(req.body, (error, results) => {
    if (error) {
      return next(error);
    }
    return res.status(200).send({
      message: "Success",
      data: results,
    });
  });
};

exports.getShopAppointments = (req, res, next) => {
  appointmentServices.getShopAppointments(req, res, (error, results) => {
    if (error) {
      return next(error);
    }
    return res.status(200).send({
      message: "Success",
      data: results,
    });
  });
};

exports.getUserAppointments = (req, res, next) => {
  console.log("userid", req.params.id);
  appointmentServices.getUserAppointments(req, res, (error, results) => {
    if (error) {
      return next(error);
    }
    return res.status(200).send({
      message: "Success",
      data: results,
    });
  });
};
exports.getAppointment = (req, res, next) => {
  appointmentServices.getAppointment(req, (error, results) => {
    if (error) {
      return next(error);
    }
    return res.status(200).send({
      message: "Success",
      data: results,
    });
  });
};

exports.cancelAppointment = (req, res, next) => {
  console.log(req.body);

  appointmentServices.cancelAppointment(req, res, (error, results) => {
    if (error) {
      return next(error);
    }
    return res.status(200).send({
      message: "Success",
      data: results,
    });
  });
};