import asyncHandler from '../layers/asyncHandler.js'
import Employee from '../models/employee.js'
import generateToken from '../utils/generateToken.js';
import Handlebars from 'handlebars';
import fs from 'fs'
import path from 'path'
import transporter from '../config/mailConfig.js'

export const authEmployee = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const employee = await Employee.findOne({ email });

  if (employee && (await employee.matchPassword(password))) {
    const token = generateToken({ userId: employee._id, level: employee.level });
    return res.status(200).json({ userToken: token })
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
})

export const registerEmployee = asyncHandler(async (req, res) => {
  const employeeExists = await Employee.findOne({ email: req.body.email })

  if (employeeExists) {
    res.status(400);
    throw new Error('Employee already exists');
  }
  const employee = await Employee.create(req.body)

  if (!employee) {
    res.status(400)
    throw new Error('Invalid employee data')
  }
  return res.status(201).json({ _id: employee._id })
})

export const getEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id).select("-password")

  if (!employee) {
    res.status(404)
    throw new Error('Employee not found')
  }
  return res.status(200).json(employee)
})

export const me = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, level, _id } = req.user
  return res.status(200).json({ firstName, lastName, email, level, _id })
})

export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id)

  if (!employee) {
    res.status(404)
    throw new Error('Employee not found')
  }

  Object.keys(req.body).forEach(key => {
    employee[key] = req.body[key]
  })

  await employee.save()

  return res.status(204).send()
})


export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body
  if (!email) {
    res.status(400)
    throw new Error('Email is required')
  }

  const employee = await Employee.findOne({ email }).exec()
  if (!employee) {
    res.status(404)
    throw new Error('Employee not found')
  }

  const token = generateToken({ userId: employee._id });
  const templateHtml = fs.readFileSync(path.join(process.cwd(), "views", "forgotpassword.html"), "utf8");

  const resetLink = `${process.env.PASSWORD_RESET_LINK}?token=${token}`
  const html = Handlebars.compile(templateHtml)({ resetLink })

  transporter().sendMail({
    from: '"Gajanan Motors" <shreegajananmotors8284@gmail.com>',
    to: email,
    subject: "Password reset",
    html,
  }).catch(console.error);

  return res.status(204).send()
})

export const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body
  await Employee.updateOne({ _id: req.user._id }, { password }).exec()
  return res.status(204).send()
})
