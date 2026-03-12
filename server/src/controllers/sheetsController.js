import { google } from 'googleapis';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the service account JSON file directly — avoids private key newline issues with dotenv
const require = createRequire(import.meta.url);
const serviceAccount = require(path.resolve(__dirname, '../brave-cistern-447115-t5-c4a0113b34ff.json'));

const SHEET_IDS = [
  '1Ece40wMrW4uy2Yz1dvEjXalhU56oB3zK5IZtKdxj2uw',
  '1oyfEWbZYU_u3W2gRor0E1f8QcTHEQrGTf0X6Q2pgMaA',
];

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: SCOPES,
  });
}

function rowsToObjects(rows) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map(h => String(h).trim().toLowerCase());
  return rows.slice(1)
    .filter(row => row.some(cell => cell))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = String(row[i] || '').trim();
      });
      return obj;
    });
}

export async function getMedicineRecords(req, res) {
  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const results = await Promise.all(
      SHEET_IDS.map(id =>
        sheets.spreadsheets.values.get({
          spreadsheetId: id,
          range: 'Sheet1',
        })
      )
    );

    const allRecords = results.flatMap(r => rowsToObjects(r.data.values || []));

    return res.json({ success: true, count: allRecords.length, records: allRecords });
  } catch (err) {
    console.error('Sheets fetch error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}
