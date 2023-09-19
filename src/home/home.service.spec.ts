import { Test, TestingModule } from '@nestjs/testing';
import { HomeSelect, HomeService } from './home.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PropertyType } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

const mockGetHomes = [
  {
    id: 11,
    address: 'address 4',
    city: 'city2',
    price: 50000,
    property_type: PropertyType.RESIDENTIAL,
    image: 'img5',
    number_of_bedrooms: 3,
    number_of_bathrooms: 2,
    images: [
      {
        url: 'img1',
      },
    ],
  },
];

const mockHome = {
  id: 1,
  address: 'address 4',
  city: 'city2',
  price: 50000,
  property_type: PropertyType.RESIDENTIAL,
  image: 'img5',
  number_of_bedrooms: 3,
  number_of_bathrooms: 2,
};

const mockImages = [
  {
    id: 1,
    url: 'img1',
  },
  {
    id: 2,
    url: 'img2',
  },
];

describe('HomeService', () => {
  let service: HomeService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeService,
        {
          provide: PrismaService,
          useValue: {
            home: {
              findMany: jest.fn().mockReturnValue(mockGetHomes),
              create: jest.fn().mockResolvedValue(mockHome),
            },
            image: {
              createMany: jest.fn().mockReturnValue(mockImages),
            },
          },
        },
      ],
    }).compile();

    service = module.get<HomeService>(HomeService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHomes', () => {
    const filters = {
      city: 'city1',
      price: {
        gte: 1000,
        lte: 5000,
      },
      propertyType: PropertyType.RESIDENTIAL,
    };
    it('should call prisma home.findMany with correct params', async () => {
      const mockPrismaFindManyHomes = jest.fn().mockReturnValue(mockGetHomes);

      jest
        .spyOn(prismaService.home, 'findMany')
        .mockImplementation(mockPrismaFindManyHomes);

      await service.getHomes(filters);

      expect(mockPrismaFindManyHomes).toBeCalledWith({
        select: {
          ...HomeSelect,
          images: {
            select: {
              url: true,
            },
            take: 1,
          },
        },
        where: filters,
      });
    });

    it('should throw not found exception if no homes are found', async () => {
      const mockPrismaFindManyHomes = jest.fn().mockReturnValue([]);

      jest
        .spyOn(prismaService.home, 'findMany')
        .mockImplementation(mockPrismaFindManyHomes);

      await expect(service.getHomes(filters)).rejects.toThrowError(
        NotFoundException,
      );
    });
  });

  describe('createHome', () => {
    const mockCreateHomeParams = {
      address: 'address 1',
      city: 'city2',
      images: [
        {
          url: 'img1',
        },
      ],
      landSize: 150,
      numberOfBathrooms: 2,
      numberOfBedrooms: 2,
      price: 1500,
      propertyType: PropertyType.CONDO,
    };
    it('sould call prisma home.create with the correct payload', async () => {
      const mockCreateHome = jest.fn().mockReturnValue(mockHome);

      jest
        .spyOn(prismaService.home, 'create')
        .mockImplementation(mockCreateHome);

      await service.createHome(mockCreateHomeParams, 7);

      expect(mockCreateHome).toBeCalledWith({
        data: {
          address: 'address 1',
          city: 'city2',
          land_size: 150,
          number_of_bathrooms: 2,
          number_of_bedrooms: 2,
          price: 1500,
          propertyType: PropertyType.CONDO,
          realtor_id: 7,
        },
      });
    });

    it('should call prisma image.createMany with the correct payload', async () => {
      const mockCreateManyImage = jest.fn().mockReturnValue(mockImages);

      jest
        .spyOn(prismaService.image, 'createMany')
        .mockImplementation(mockCreateManyImage);

      await service.createHome(mockCreateHomeParams, 7);

      expect(mockCreateManyImage).toBeCalledWith({
        data: [
          {
            url: 'img1',
            home_id: 1,
          },
        ],
      });
    });
  });
});
