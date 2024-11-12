import { faker } from '@faker-js/faker';
import { User, IUser } from '#models/user';


const USERS_COUNT = 80;

const UserSeeder = async () => {
  const users: Partial<IUser>[] = Array.from({ length: USERS_COUNT }, () => ({
    telegramId: faker.number.int({ min: 10 ** 6, max: 10 ** 9 - 1 }),
    username: faker.internet.username(),
    firstName: faker.person.firstName(),
    lastName: faker.datatype.boolean({ probability: 0.1 }) ? faker.person.lastName() : '',
    languageCode: faker.helpers.arrayElement(['en', 'ru']),
    photoUrl: faker.image.avatar(),
    isPremium: faker.datatype.boolean(),
    createdAt: faker.date.recent({ days: 90 }),
  }));

  console.info('Seeding users...');

  await User.insertMany(users);

  console.info(`Users created: ${USERS_COUNT}`);
}

export default UserSeeder;
