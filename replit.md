# Replit.md

## Overview

This is a Canadian mortgage calculator application built with a modern web stack. The application provides sophisticated loan calculation capabilities with support for Canadian mortgage regulations, including semi-annual compounding and business day adjustments. It features a React frontend with shadcn/ui components and an Express.js backend with PostgreSQL database integration using Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Form Management**: React Hook Form with Zod validation
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database**: PostgreSQL with Neon serverless integration
- **ORM**: Drizzle ORM for type-safe database operations
- **Session Management**: PostgreSQL session store with connect-pg-simple

### Key Design Decisions

1. **Monorepo Structure**: Single repository with `client/`, `server/`, and `shared/` directories for code organization
2. **Type Safety**: Full TypeScript implementation across frontend, backend, and shared schemas
3. **Component Library**: shadcn/ui for consistent, accessible UI components
4. **Database-First**: Drizzle schema defines the data structure with automatic TypeScript types

## Key Components

### Database Schema (`shared/schema.ts`)
- **Loan Calculations Table**: Stores mortgage calculation parameters and results
- **Validation Schemas**: Zod schemas for input validation and type safety
- **Canadian Mortgage Features**: Support for semi-annual compounding, business day adjustments

### Financial Calculations (`client/src/lib/financial-calculations.ts`)
- **Payment Calculation**: Handles various payment frequencies and compounding
- **Amortization Schedule**: Generates detailed payment breakdowns
- **Canadian Compliance**: Business day adjustments and holiday calculations

### UI Components
- **Loan Calculator**: Main calculator interface with form validation
- **Currency Input**: Specialized input for monetary values
- **Percentage Input**: Specialized input for interest rates
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## Data Flow

1. **User Input**: Form data collected through React Hook Form
2. **Validation**: Client-side validation using Zod schemas
3. **Calculation**: Complex financial calculations performed client-side
4. **Display**: Results shown in interactive tables and summaries
5. **Storage**: Optional persistence to PostgreSQL database

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form state management
- **zod**: Runtime type validation
- **date-fns**: Date manipulation utilities

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **class-variance-authority**: Component variant management

## Deployment Strategy

### Development
- **Dev Server**: Vite development server with HMR
- **API Server**: Express.js with tsx for TypeScript execution
- **Database**: Neon PostgreSQL serverless instance

### Production
- **Build Process**: Vite builds frontend, esbuild bundles backend
- **Static Assets**: Frontend built to `dist/public`
- **Server Bundle**: Backend bundled to `dist/index.js`
- **Database Migrations**: Drizzle Kit for schema management

### Environment Configuration
- **Database**: Requires `DATABASE_URL` environment variable
- **Sessions**: PostgreSQL-based session storage
- **CORS**: Configured for cross-origin requests in development

### Special Features
- **Canadian Holidays**: Built-in calculation of statutory holidays
- **Business Days**: Automatic payment date adjustments
- **Multiple Compounding**: Support for various compounding frequencies
- **Responsive Tables**: Paginated amortization schedules
- **Export Functionality**: Planned CSV/PDF export capabilities

The application is designed to be a comprehensive mortgage calculation tool specifically tailored for Canadian mortgage regulations and practices.