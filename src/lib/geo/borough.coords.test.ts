import { describe, expect, it } from "vitest";
import { boroughFromCoords } from "./borough";

// Interior landmarks — these must classify correctly.
const LANDMARKS: [string, number, number, string][] = [
  ["Times Square", 40.758, -73.9855, "Manhattan"],
  ["Central Park", 40.782, -73.965, "Manhattan"],
  ["Washington Heights", 40.84, -73.94, "Manhattan"],
  ["Battery Park", 40.703, -74.016, "Manhattan"],
  ["Yankee Stadium", 40.8296, -73.9265, "Bronx"],
  ["Bronx Zoo", 40.8506, -73.8769, "Bronx"],
  ["Coney Island", 40.5755, -73.9876, "Brooklyn"],
  ["Downtown Brooklyn", 40.6925, -73.99, "Brooklyn"],
  ["Prospect Park", 40.6602, -73.969, "Brooklyn"],
  ["Flushing Meadows", 40.7466, -73.8422, "Queens"],
  ["Astoria", 40.7644, -73.9235, "Queens"],
  ["JFK Airport", 40.6413, -73.7781, "Queens"],
  ["St. George SI", 40.6437, -74.0776, "Staten Island"],
  ["Great Kills SI", 40.5512, -74.1496, "Staten Island"],
];

describe("boroughFromCoords", () => {
  it.each(LANDMARKS)("places %s in %s", (_name, lat, lng, expected) => {
    expect(boroughFromCoords(lat, lng)).toBe(expected);
  });

  it("returns null outside the NYC area", () => {
    expect(boroughFromCoords(34.05, -118.24)).toBeNull(); // LA
    expect(boroughFromCoords(40.73, -74.17)).toBeNull(); // Newark NJ
  });
});
