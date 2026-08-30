import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const { feedback, type, email, userAgent } = await req.json();

        if (!feedback) {
            return NextResponse.json({ error: 'Feedback message is required' }, { status: 400 });
        }

        const date = new Date();
        const formattedDate = date.toLocaleString('en-GB', { 
            day: 'numeric', month: 'numeric', year: 'numeric', 
            hour: 'numeric', minute: 'numeric', second: 'numeric', 
            hour12: true 
        }).toLowerCase();
        
        const id = crypto.randomUUID();
        const safeEmail = email ? email : 'Not provided';
        const safeType = type ? type.toUpperCase() : 'BUG';

        const logEntry = `==================================================
Date:   ${formattedDate}
Type:   ${safeType}
Email:  ${safeEmail}
ID:     ${id}
--------------------------------------------------
MESSAGE:
${feedback}
==================================================

`;

        const logFilePath = path.join(process.cwd(), 'feedback.log');
        
        await fs.appendFile(logFilePath, logEntry, 'utf-8');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to save feedback:', error);
        return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }
}
