import { google } from 'googleapis';

const SHEET_IDS = [
  '1Ece40wMrW4uy2Yz1dvEjXalhU56oB3zK5IZtKdxj2uw',
  '1oyfEWbZYU_u3W2gRor0E1f8QcTHEQrGTf0X6Q2pgMaA',
];

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

function getAuth() {
  const serviceAccount = {
    type: 'service_account',
    project_id: process.env.GOOGLE_SA_PROJECT_ID,
    private_key_id: process.env.GOOGLE_SA_PRIVATE_KEY_ID,
    private_key: (process.env.GOOGLE_SA_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_SA_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_SA_CLIENT_ID,
    token_uri: 'https://oauth2.googleapis.com/token',
  };

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
