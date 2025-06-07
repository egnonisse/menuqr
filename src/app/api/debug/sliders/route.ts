import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET(request: NextRequest) {
  try {
    // Get restaurant slug from query params
    const { searchParams } = new URL(request.url);
    const restaurantSlug = searchParams.get('restaurant') || 'resto-test';

    console.log("Debug: Looking for restaurant:", restaurantSlug);

    // Find restaurant first
    const restaurant = await db.restaurant.findUnique({
      where: { slug: restaurantSlug },
      include: {
        homepage: true,
      }
    });

    if (!restaurant) {
      return NextResponse.json({ 
        error: "Restaurant not found",
        slug: restaurantSlug
      }, { status: 404 });
    }

    console.log("Debug: Found restaurant:", restaurant.name);
    console.log("Debug: Homepage data:", restaurant.homepage);

    // Parse sliders from homepage
    let sliders = [];
    if (restaurant.homepage?.sliders) {
      try {
        const slidersData = typeof restaurant.homepage.sliders === 'string' 
          ? JSON.parse(restaurant.homepage.sliders)
          : restaurant.homepage.sliders;
        
        sliders = Array.isArray(slidersData) ? slidersData : [];
        console.log("Debug: Parsed sliders:", sliders);
      } catch (e) {
        console.error("Debug: Error parsing sliders:", e);
      }
    }

    return NextResponse.json({
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
      },
      homepage: restaurant.homepage,
      sliders: sliders,
      slidersCount: sliders.length,
      rawSlidersData: restaurant.homepage?.sliders,
    });

  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch debug data", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 