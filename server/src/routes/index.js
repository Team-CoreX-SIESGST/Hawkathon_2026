import express from 'express';

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'API is healthy' });
});

// Add your resource routes here
// import userRoutes from './userRoutes.js';
// router.use('/users', userRoutes);

export default router;
