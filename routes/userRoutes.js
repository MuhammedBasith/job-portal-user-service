const express = require('express');
const User = require('../models/User');
const axios = require('axios');
const router = express.Router();

/**
 * Endpoint to register a new user.
 */
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

/**
 * Endpoint to get all applicants for a specific job.
 */
router.get('/:jobId/getAllApplicants', async (req, res) => {
  const jobId = req.params.jobId;

  try {
    const applicants = await User.find(
      { "appliedJobs.jobId": jobId },
      { username: 1, email: 1, "appliedJobs.$": 1 }
    );

    if (applicants.length === 0) {
      return res.status(404).json({ message: "No applicants found for this job." });
    }

    res.status(200).json(applicants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Endpoint for a user to apply for a job.
 */
router.post('/:userId/apply', async (req, res) => {
  const { jobId } = req.body;
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.appliedJobs.push({ jobId });
    await user.save();

    try {
      const response = await axios.post("http://localhost:4000/jobs/apply", { jobId });
      if (response.status === 200) {
        return res.status(200).json(user);
      } else {
        throw new Error('Error updating job application count');
      }
    } catch (axiosError) {
      user.appliedJobs.pop(); // Revert the applied job
      await user.save();
      return res.status(500).json({ message: 'Error communicating with job service', error: axiosError.message });
    }

  } catch (error) {
    res.status(400).json({ message: 'Error applying for job', error });
  }
});

/**
 * Endpoint to fetch a user's job applications.
 */
router.get('/:userId/applications', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    res.status(200).json(user.appliedJobs);
  } catch (error) {
    res.status(400).json({ message: 'Error fetching applications', error });
  }
});

/**
 * Endpoint to get all jobs from the Job Service.
 */
router.get('/jobs', async (req, res) => {
  try {
    const response = await axios.get("http://localhost:4000/jobs/");
    res.status(200).json(response.data);
  } catch (axiosError) {
    console.error('Error calling job service:', axiosError.message);
    res.status(500).json({ message: 'Error communicating with job service', error: axiosError.message });
  }
});

module.exports = router;
