import { Gift, IGift } from '#models/gift';
import { Currency } from '#constants/currency';


const GiftSeeder = async () => {
  const gifts: IGift[] = [
    {
      name: 'Delicious Cake',
      previewUrl: '/gifts/preview/gift-delicious-cake.png',
      animationUrl: '/gifts/lottie/gift-delicious-cake.json',
      animationSequence: [{ direction: 1 }],
      color: '#FE9F41',
      quantity: 500,
      price: 10,
      currency: Currency.USDT,
      sold: 3,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      name: 'Green Star',
      previewUrl: '/gifts/preview/gift-green-star.png',
      animationUrl: '/gifts/lottie/gift-green-star.json',
      animationSequence: [{ direction: -1 }, { direction: 1 }],
      color: '#46D100',
      quantity: 3000,
      price: 5,
      currency: Currency.TON,
      sold: 800,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    },
    {
      name: 'Blue Star',
      previewUrl: '/gifts/preview/gift-blue-star.png',
      animationUrl: '/gifts/lottie/gift-blue-star.json',
      animationSequence: [{ direction: -1 }, { direction: 1 }],
      color: '#007AFF',
      quantity: 5000,
      price: 0.01,
      currency: Currency.ETH,
      sold: 500,
      createdAt: new Date('2022-01-01'),
      updatedAt: new Date('2022-01-01'),
    },
    {
      name: 'Red Star',
      previewUrl: '/gifts/preview/gift-red-star.png',
      animationUrl: '/gifts/lottie/gift-red-star.json',
      animationSequence: [{ direction: -1 }, { direction: 1 }],
      color: '#FF4747',
      quantity: 10000,
      price: 1,
      currency: Currency.TON,
      sold: 10000,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      name: 'Very Delicious Cake',
      previewUrl: '/gifts/preview/gift-delicious-cake.png',
      animationUrl: '/gifts/lottie/gift-delicious-cake.json',
      animationSequence: [{ direction: 1 }],
      color: '#FE9F41',
      quantity: 500,
      price: 10,
      currency: Currency.USDT,
      sold: 500,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    },
    {
      name: 'Very Blue Star',
      previewUrl: '/gifts/preview/gift-blue-star.png',
      animationUrl: '/gifts/lottie/gift-blue-star.json',
      animationSequence: [{ direction: -1 }, { direction: 1 }],
      color: '#007AFF',
      quantity: 5000,
      price: 0.01,
      currency: Currency.ETH,
      sold: 5000,
      createdAt: new Date('2022-01-01'),
      updatedAt: new Date('2022-01-01'),
    },
  ];

  console.info('Seeding gifts...');

  let count = 0;
  for (const gift of gifts) {
    const existingGift = await Gift.findOne({ name: gift.name }).exec();

    if (!existingGift) {
      await Gift.create(gift);
      count++;
    }
  }

  console.info(`Gifts created: ${count}`);
}

export default GiftSeeder;
