import { NextResponse, type NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Allow all requests to pass through for now
  // Authentication will be handled client-side
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
