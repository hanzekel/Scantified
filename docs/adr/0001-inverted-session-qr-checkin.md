# 0001: Inverted Self-Check-in via Dynamic Session QR Codes

## Context
Traditional attendance systems assign individual QR badges to attendees, requiring designated staff with scanners to scan each person. For ministries, youth camps, and large classes, this creates registration queues, high printing costs, and hardware bottlenecks.

## Decision
We decided to invert the scanning model: each `EventSession` generates and displays a time-rotating dynamic Session QR code on the venue's projector or screen. Attendees scan this single QR code using their own smartphone camera to self-check-in against the pre-enrolled roster. The QR token rotates every 15–30 seconds to prevent attendees from photographing and texting the code to absent peers.

## Consequences & Trade-offs
- Eliminates attendee badge printing and scanner hardware bottlenecks.
- Relies on attendees having internet-connected smartphones with cameras.
- Requires a fallback mechanism for visitors/guests not in the roster and members without working smartphones.

