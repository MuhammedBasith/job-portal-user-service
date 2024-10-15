const express = require('express');
const User = require('../models/User');
const router = express.Router();
const axios = require("axios")


router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const newUser = new User({ username, email, password });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: 'Error registering user', error });
  }
});

router.post('/:userId/apply', async (req, res) => {
  const { jobId } = req.body;
  const { userId } = req.params;

  try {
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user's applied jobs
    user.appliedJobs.push({ jobId });
    await user.save();

    // Make request to Job Service
    try {
      const response = await axios.post("http://localhost:4000/jobs/apply", { jobId });
      if (response.status === 200) {
        return res.status(200).json(user);
      } else {
        // If the job service responds but is not 200, handle it
        return res.status(500).json({ message: 'Error updating job application count' });
      }
    } catch (axiosError) {
      // Handle Axios errors
      console.error('Error calling job service:', axiosError.message);
      // Optionally, revert the user update if needed
      user.appliedJobs.pop(); // Remove the last added jobId
      await user.save(); // Save the rollback
      return res.status(500).json({ message: 'Error communicating with job service', error: axiosError.message });
    }

  } catch (error) {
    res.status(400).json({ message: 'Error applying for job', error });
  }
});


router.get('/:userId/applications', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).populate('appliedJobs.jobId');
    res.status(200).json(user.appliedJobs);
  } catch (error) {
    res.status(400).json({ message: 'Error fetching applications', error });
  }
});


router.get("/jobs", async (req, res) => {
  try {

    try {
      const response = await axios.get("http://localhost:4000/jobs/");
      if (response.status === 200) {
        return res.status(200).json(response.data);
      } else {

        return res.status(500).json({ message: 'Error updating job application count' });
      }
    } catch (axiosError) {
      console.error('Error calling job service:', axiosError.message);
      user.appliedJobs.pop();
      await user.save(); 
      return res.status(500).json({ message: 'Error communicating with job service', error: axiosError.message });
    }


  } catch (error) {
    res.status(500).json({ message: 'Error fetching Jobs', error });
  }
})

module.exports = router;
