const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());

app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', message: 'CouPreshFund API is running' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});