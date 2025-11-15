import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 400 }
      );
    }

    // Test the API key with a simple request
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent('Say "API key is working" in exactly 5 words.');
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      message: 'API key is valid and working',
      testResponse: text
    });
  } catch (error: any) {
    console.error('API key test error:', error);
    
    let errorMessage = 'API key test failed';
    if (error.message?.includes('API_KEY_INVALID')) {
      errorMessage = 'Invalid API key. Please check your key and try again.';
    } else if (error.message?.includes('quota')) {
      errorMessage = 'API quota exceeded. Please check your Google Cloud Console.';
    }

    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: 400 }
    );
  }
}