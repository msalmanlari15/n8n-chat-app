import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for thinking status (you can use localStorage on client side)
const thinkingStatus = new Map<string, any>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, messageId, status, message, type = 'thinking' } = body

    if (!sessionId || !messageId) {
      return NextResponse.json(
        { error: 'sessionId and messageId are required' },
        { status: 400 }
      )
    }

    const key = `${sessionId}-${messageId}`
    const timestamp = new Date().toISOString()

    // Store the status update
    thinkingStatus.set(key, {
      sessionId,
      messageId,
      status,
      message,
      type,
      timestamp
    })

    // Clean up old entries (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    for (const [k, v] of thinkingStatus.entries()) {
      if (new Date(v.timestamp).getTime() < fiveMinutesAgo) {
        thinkingStatus.delete(k)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Status update error:', error)
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get('sessionId')
  const messageId = searchParams.get('messageId')

  if (!sessionId || !messageId) {
    return NextResponse.json(
      { error: 'sessionId and messageId are required' },
      { status: 400 }
    )
  }

  const key = `${sessionId}-${messageId}`
  const status = thinkingStatus.get(key)

  if (!status) {
    return NextResponse.json({ status: null })
  }

  return NextResponse.json({ status })
}

// Clear status endpoint
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get('sessionId')
  const messageId = searchParams.get('messageId')

  if (!sessionId || !messageId) {
    return NextResponse.json(
      { error: 'sessionId and messageId are required' },
      { status: 400 }
    )
  }

  const key = `${sessionId}-${messageId}`
  thinkingStatus.delete(key)

  return NextResponse.json({ success: true })
}
