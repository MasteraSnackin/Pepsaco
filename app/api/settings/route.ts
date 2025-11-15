import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

const ENV_FILE_PATH = join(process.cwd(), '.env.local');

export async function GET(request: NextRequest) {
  try {
    // Return masked API key if it exists
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    return NextResponse.json({
      geminiApiKey: geminiApiKey || '',
      hasKey: !!geminiApiKey
    });
  } catch (error: any) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { geminiApiKey } = await request.json();

    if (!geminiApiKey || typeof geminiApiKey !== 'string') {
      return NextResponse.json(
        { error: 'Invalid API key provided' },
        { status: 400 }
      );
    }

    // Read current .env.local file
    let envContent = '';
    try {
      envContent = await readFile(ENV_FILE_PATH, 'utf-8');
    } catch (error) {
      // File doesn't exist, create new content
      envContent = '';
    }

    // Update or add GEMINI_API_KEY
    const lines = envContent.split('\n');
    let keyFound = false;
    
    const updatedLines = lines.map(line => {
      if (line.startsWith('GEMINI_API_KEY=') || line.startsWith('# GEMINI_API_KEY=')) {
        keyFound = true;
        return `GEMINI_API_KEY=${geminiApiKey}`;
      }
      return line;
    });

    // If key wasn't found, add it
    if (!keyFound) {
      // Find the Gemini configuration section or add it
      const geminiSectionIndex = updatedLines.findIndex(line => 
        line.includes('Google Gemini Configuration')
      );
      
      if (geminiSectionIndex !== -1) {
        // Insert after the comment line
        updatedLines.splice(geminiSectionIndex + 2, 0, `GEMINI_API_KEY=${geminiApiKey}`);
      } else {
        // Add at the end
        updatedLines.push('');
        updatedLines.push('# Google Gemini Configuration (for AI Features)');
        updatedLines.push('# Get your API key from: https://makersuite.google.com/app/apikey');
        updatedLines.push(`GEMINI_API_KEY=${geminiApiKey}`);
      }
    }

    // Write back to file
    await writeFile(ENV_FILE_PATH, updatedLines.join('\n'), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'API key saved successfully. Please restart the server for changes to take effect.'
    });
  } catch (error: any) {
    console.error('Settings POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save settings' },
      { status: 500 }
    );
  }
}