// // Adding the required imports
// User can only touch these routes only if he is logged in
// Adding express-router, importing the model, assuming that the user can only make event only if he is logged in, so jwt token must be stored in the cookies
// That's the job must be there for the client side

const express = require("express");
const router = express.Router();
const Event = require("../Models/Event.js");
const { body, validationResult } = require("express-validator");
const fetchuser = require("../middleware/fetchuser");
const User = require("../Models/User");

// Route 1: /api/event/createEvent to create a event: auth required is taken care of by jwt

router.post(
  "/createEvent",
  fetchuser,
  [
    body("title", "Enter a valid title for event").isLength({ min: 5 }),
    body("description", "Enter a valid description for the event").isLength({
      min: 5,
    }),
    body("date", "Enter a valid date is yyyy-mm-dd format")
      .isISO8601()
      .toDate(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const invites_array = req.body.invites;
    const event = await Event.create({
      user: req.user.id,
      title: req.body.title,
      description: req.body.description,
      invites: invites_array,
      date: req.body.date,
    });
    res.json({ success: true, info: "Event has been added successfully" });
  }
);

// Route 2: /api/event/updateEvent to update an event created by the user: auth is taken care by jwt

router.put("/updateEvent/:eventID", fetchuser, async (req, res) => {
  const { title, description, date, invites } = req.body;
  let newevent = {};
  if (title) {
    newevent.title = title;
  }
  if (description) {
    newevent.description = description;
  }
  if (date) {
    newevent.date = date;
  }
  if (invites) {
    newevent.invites = invites;
  }
  const id = req.params.eventID;

  let event = await Event.findById(id);
  if (!event) {
    return res.status(404).send("Not Found your event");
  }

  if (event.user.toString() !== req.user.id) {
    return res.status(401).send("Not authorized to access this note");
  }
  let updatedevent = await Event.findByIdAndUpdate(
    id,
    { $set: newevent },
    { new: true }
  );
  res.json({ success: true, info: "Event has been updated successfully" });
});

// Route 3: /api/event/eventDetails No auth required. Only used to get the details of the event

router.get("/eventdetails", async (req, res) => {
  const event = await Event.findOne({ id: req.body.eventID });
  if (!event) {
    res.status(404).json({
      success: false,
      info: "Event not found with the given event id",
    });
  } else {
    const user = await User.findById(event.user._id);
    let date = new Date(event.date);
    let date_of_event =
      String(date.getDate()) +
      "-" +
      String(date.getMonth()) +
      "-" +
      String(date.getFullYear());
    const obj = {
      "event Organizer": user.name,
      "event Organizer email": user.email,
      "title of event": event.title,
      "description of event": event.description,
      event_date: date_of_event,
      "people who are invited": event.invites,
    };
    res.status(200).json(obj);
  }
});

// Route 4: /api/event/userEventDetails. Auth Required. Used when user logins and want the event he has created and event in which he is invited

router.get("/userEventDetails", fetchuser, async (req, res) => {
  const id = req.user.id;
  const user = await User.findById(id);
  const email_user = user.email;
  const events = await Event.find({});

  let event_org = [];
  let event_invited = [];

  events.forEach((event) => {
    if (String(event.user._id) == id) {
      event_org.push(event);
    } else {
      const invites = event.invites;
      invites.forEach((email) => {
        if (email == email_user) {
          event_invited.push(event);
        }
      });
    }
  });
  const obj = {};
  obj.event_invited = !event_invited.length
    ? "U are not invited to any event"
    : event_invited;
  obj.event_organized = !event_org.length
    ? "U have not organized any event"
    : event_org;
  res.json(obj);
});

// Route 5: /api/event/userEventConstraint Displaying user's event data based on pagination, sorting, date filter and search filter. Auth required
//  By date filter I mean list all events after this date
// By search filter I mean that user can search for a event hosted by particular email
// Since pagination is not well understood by me, I am ignoring that factor

router.post("/userEventConstraint", fetchuser, async (req, res) => {
  const { date, search } = req.body;
  // This is done in order to sort the events by date by ascending order so that order's that are coming first in the calender can be shown with priority
  let events = (await Event.find({}, null, { sort: { date: -1 } })).reverse();
  // Now if date is constraint is applied i.e. we want events after particular date

  if (date) {
    events = events.filter((event) => event.date > new Date(date));
  }
  let user = await User.findOne({ email: search });
  if (!user) res.status(404).json({ error: "No user with such email found" });
  else {
    let id = String(user._id);
    events = events.filter((event) => String(event.user._id) == id);
  }


  let event_org = [];
  let event_invited = [];
  let id = req.user.id;
  user = await User.findById(id);
  let email_user = user.email;

  events.forEach((event) => {
    if (String(event.user._id) == id) {
      event_org.push(event);
    } else {
      const invites = event.invites;
      invites.forEach((email) => {
        if (email == email_user) {
          event_invited.push(event);
        }
      });
    }
  });
  const obj = {};
  obj.event_invited = !event_invited.length
    ? "U are not invited to any event"
    : event_invited;
  obj.event_organized = !event_org.length
    ? "U have not organized any event"
    : event_org;
  res.json(obj);
});

module.exports = router;
