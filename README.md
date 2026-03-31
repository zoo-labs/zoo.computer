# Zoo.Computer - AI Hardware Marketplace

A modern ecommerce platform for purchasing AI compute hardware, featuring the DGX Spark instance ($4,000) as the only credit card purchasable item, with enterprise solutions requiring sales consultation.

## Features

### Ecommerce Functionality

- **Shopping Cart**: Full cart management with add/remove/quantity controls
- **Checkout Flow**: Secure payment via Zoo Billing
- **Order Management**: Account page with order history and status tracking
- **Purchase Methods**:
  - **Credit Card**: DGX Spark ($4,000) - instant online purchase via billing portal
  - **Sales Call Required**: GPU On-Demand and Enterprise solutions

### User Experience

- **Cart Icon**: Live cart item counter in header
- **Account Dashboard**: View order history, active instances, and total spent
- **Visual Indicators**:
  - "Buy Now" badge on purchasable items
  - "Contact Sales Required" badges on enterprise items
  - Clear payment method indicators on each product card
- **Responsive Design**: Mobile-first, works on all devices

### Technical Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **Routing**: React Router v7
- **Payments**: Zoo Billing (billing.zoo.ngo)
- **State Management**: React Context API
- **Persistence**: LocalStorage for cart and orders

## Installation

```bash
npm install
```

## Configuration

### Environment Setup

1. Create a `.env` file from the example:
```bash
cp .env.example .env
```

2. Configure your environment variables as documented in `.env.example`.

## Development

```bash
npm run dev
```

Visit http://localhost:5173

## Build

```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
computer/
├── src/
│   ├── context/
│   │   └── CartContext.tsx        # Shopping cart state management
│   └── pages/
│       ├── Cart.tsx               # Shopping cart page
│       ├── Checkout.tsx           # Checkout form (redirects to billing portal)
│       └── Account.tsx            # Order history & account dashboard
├── components/
│   ├── Header.tsx                 # Navigation with cart icon
│   ├── Pricing.tsx                # Product cards with purchase methods
│   ├── Hero.tsx                   # Landing page hero
│   ├── Features.tsx               # Feature highlights
│   ├── HardwareSpec.tsx           # Hardware specifications
│   ├── Partners.tsx               # Partner logos
│   ├── ImageGallery.tsx           # Product images
│   ├── CallToAction.tsx           # CTA section
│   └── Footer.tsx                 # Site footer
├── App.tsx                        # Main app with routing
└── .env.example                   # Environment variables template
```

## Shopping Flow

### 1. Browse Products (Homepage)
- View 3 tiers: DGX Spark, GPU On-Demand, Enterprise
- DGX Spark shows "Buy Now" badge and credit card icon
- Other products show "Contact Sales Required"

### 2. Add to Cart (DGX Spark Only)
- Click "Add to Cart" on DGX Spark
- See success feedback
- Cart icon updates with item count
- Auto-redirect to cart page

### 3. Shopping Cart
- **Purchasable Items**: DGX Spark with quantity controls
- **Sales Items**: Enterprise products with "Schedule Sales Call" button
- Remove items or update quantities
- See total price for purchasable items
- Proceed to checkout or contact sales

### 4. Checkout
- Collect billing details (email, name)
- Redirect to Zoo Billing portal for secure payment
- Order summary before redirect

### 5. Order Confirmation
- Redirect to Account page with success message
- Order appears in history
- Instance provisioning timeline: 24-48 hours

### 6. Account Dashboard
- View all orders with status
- See active instances
- Track total spending
- Quick links to support and enterprise sales

## Payment Methods

### Credit Card
**Product**: DGX Spark ($4,000)
- Instant online purchase via Zoo Billing
- Secure payment processing
- Immediate order confirmation
- Instance provisioned in 24-48 hours

**Features**:
- PCI-compliant checkout
- Supports all major credit cards
- International payments
- Email confirmations

### Sales Call (Enterprise)
**Products**: GPU On-Demand, Enterprise & Resale
- Custom quotes required
- Configuration consultation
- Volume discounts available
- Managed services options

**Contact**: https://zoo.ngo/contact

## Security

- Zoo Billing handles all sensitive payment data (PCI-compliant)
- No credit card data stored on client or server
- HTTPS required for production
- Environment variables for API keys
- CORS and CSP headers recommended

## Data Storage

### LocalStorage
- **Cart**: `localStorage.cart` - Shopping cart items
- **Orders**: `localStorage.orders` - Order history (demo)

**Note**: In production, orders should be stored in a backend database with proper authentication.

## Deployment

### GitHub Pages (Current)
The site is deployed to GitHub Pages via GitHub Actions:

```yaml
# .github/workflows/deploy.yml
- Builds on push to main
- Deploys to gh-pages branch
- Live at: https://zaboratory.github.io/computer/
```

### Production Deployment

For production with real payments:

1. **Backend API**: Implement server-side billing integration
   - Create payment sessions via Zoo Commerce API
   - Handle webhooks
   - Store orders in database
   - Send email confirmations

2. **Database**: Store orders, users, instances
   - PostgreSQL or MongoDB recommended
   - User authentication (Auth0, Clerk, etc.)
   - Order tracking and status updates

3. **Email**: Set up transactional emails
   - Order confirmations
   - Instance provisioning updates
   - Invoice generation

## Future Enhancements

### Short Term
- [ ] Backend API for order processing
- [ ] User authentication (login/signup)
- [ ] Email confirmations
- [ ] Invoice generation
- [ ] Payment receipts

### Medium Term
- [ ] Subscription support (GPU On-Demand)
- [ ] Usage tracking dashboard
- [ ] Multiple payment methods (ACH, wire transfer, crypto)
- [ ] Tax calculation
- [ ] Discount codes

### Long Term
- [ ] Self-service instance management
- [ ] Usage-based billing
- [ ] Multi-region support
- [ ] Enterprise portal
- [ ] API access for programmatic orders

## Known Issues

- Orders stored in LocalStorage (demo only)
- No actual payment processing (needs backend)
- No email confirmations
- No inventory management
- No tax calculation

## License

Proprietary - Zoo Labs Foundation.

## Support

- **Website**: https://zoo.ngo
- **Sales**: https://zoo.ngo/contact
- **Email**: support@zoo.ngo

---

Built by Zoo Labs Foundation.
