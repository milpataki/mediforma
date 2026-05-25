import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/enquiry', (req: Request, res: Response) => {
  const { name, email, org, category, message } = req.body as Record<string, string>;
  if (!name?.trim() || !email?.trim()) {
    res.status(400).json({ error: 'name and email are required' });
    return;
  }
  // In production: forward to CRM / send email via nodemailer / etc.
  console.log('[enquiry]', { name, email, org, category, message });
  res.json({ ok: true });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
