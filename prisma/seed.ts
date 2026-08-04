import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database...");
  await prisma.transaction.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating users...");
  // Create Super Admin
  const admin = await prisma.user.create({
    data: {
      email: "admin@marketplace.com",
      password: "adminpassword123", // In production, this would be hashed
      name: "أبو أحمد (المدير العام)",
      role: "ADMIN",
      isApproved: true,
    },
  });

  // Create Wholesalers
  const wholesaler1 = await prisma.user.create({
    data: {
      email: "rawabi@marketplace.com",
      password: "wholesaler123",
      name: "شركة الروابي التجارية للجملة",
      role: "WHOLESALER",
      isApproved: true,
    },
  });

  const wholesaler2 = await prisma.user.create({
    data: {
      email: "yemen_dist@marketplace.com",
      password: "wholesaler123",
      name: "المؤسسة اليمنية للتوزيع والتجارة",
      role: "WHOLESALER",
      isApproved: true,
    },
  });

  // Create Retailers
  const retailer1 = await prisma.user.create({
    data: {
      email: "baqala_noor@marketplace.com",
      password: "retailer123",
      name: "صالح العولقي (بقالة النور)",
      role: "RETAILER",
      isApproved: true,
    },
  });

  const retailer2 = await prisma.user.create({
    data: {
      email: "baqala_baraka@marketplace.com",
      password: "retailer123",
      name: "محمد اليماني (سوبرماركت البركة)",
      role: "RETAILER",
      isApproved: true,
    },
  });

  console.log("Creating stores...");
  const store1 = await prisma.store.create({
    data: {
      name: "مخازن الروابي للمواد الغذائية",
      description: "الموزع المعتمد لأرقى العلامات التجارية الغذائية، سرعة في التوصيل وأفضل أسعار الجملة.",
      logoUrl: "/logos/rawabi.png",
      ownerId: wholesaler1.id,
      isVerified: true,
    },
  });

  const store2 = await prisma.store.create({
    data: {
      name: "مخازن اليمن للتوزيع",
      description: "توفير كافة مستلزمات البقالات والتموينات من مشروبات ومواد تنظيف بجودة عالية.",
      logoUrl: "/logos/yemen_dist.png",
      ownerId: wholesaler2.id,
      isVerified: true,
    },
  });

  console.log("Creating categories...");
  const catCanned = await prisma.category.create({ data: { name: "معلبات وأغذية" } });
  const catBeverages = await prisma.category.create({ data: { name: "مشروبات ومياه" } });
  const catDetergents = await prisma.category.create({ data: { name: "منظفات وعناية" } });
  const catSnacks = await prisma.category.create({ data: { name: "حلويات وتسالي" } });

  console.log("Creating products...");
  // Products for Rawabi (Store 1)
  await prisma.product.createMany({
    data: [
      {
        name: "تونة الروابي قطعة واحدة - كرتون (48 حبة)",
        description: "تونة فاخرة بزيت دوار الشمس. وزن الحبة 160 جرام.",
        sku: "RAW-TUN-01",
        price: 24000.0, // e.g. YER / SAR
        moq: 2,
        packingUnit: "كرتون",
        stock: 120,
        imageUrl: "/products/tuna.png",
        storeId: store1.id,
        categoryId: catCanned.id,
      },
      {
        name: "فاصوليا مطبوخة حدائق طيبة - كرتون (24 حبة)",
        description: "فاصوليا حمراء جاهزة للأكل. وزن الحبة 400 جرام.",
        sku: "RAW-FAS-02",
        price: 9800.0,
        moq: 3,
        packingUnit: "كرتون",
        stock: 85,
        imageUrl: "/products/beans.png",
        storeId: store1.id,
        categoryId: catCanned.id,
      },
      {
        name: "حليب مكثف الروابي - كرتون (48 حبة)",
        description: "حليب مكثف محلى لصنع الحلويات والشاي المميز.",
        sku: "RAW-MILK-03",
        price: 18500.0,
        moq: 1,
        packingUnit: "كرتون",
        stock: 50,
        imageUrl: "/products/milk.png",
        storeId: store1.id,
        categoryId: catCanned.id,
      },
      {
        name: "شوكولاتة ميكس جواهر - صندوق (6 علب)",
        description: "حلويات شوكولاتة مشكلة للمناسبات والأعياد.",
        sku: "RAW-SWE-04",
        price: 32000.0,
        moq: 1,
        packingUnit: "صندوق",
        stock: 30,
        imageUrl: "/products/jewels.png",
        storeId: store1.id,
        categoryId: catSnacks.id,
      },
    ],
  });

  // Products for Yemen Dist (Store 2)
  await prisma.product.createMany({
    data: [
      {
        name: "مياه معدنية يمنية - كرتون (24 حبة × 500 مل)",
        description: "مياه شرب نقية وصحية معبأة محلياً.",
        sku: "YEM-WAT-01",
        price: 1500.0,
        moq: 10,
        packingUnit: "كرتون",
        stock: 500,
        imageUrl: "/products/water.png",
        storeId: store2.id,
        categoryId: catBeverages.id,
      },
      {
        name: "مشروب غازي بيبسي عائلي - كرتون (6 حبات × 2.25 لتر)",
        description: "عبوات بيبسي الغازية حجم عائلي كبير.",
        sku: "YEM-PEP-02",
        price: 6800.0,
        moq: 5,
        packingUnit: "كرتون",
        stock: 150,
        imageUrl: "/products/pepsi.png",
        storeId: store2.id,
        categoryId: catBeverages.id,
      },
      {
        name: "صابون غسيل مسحوق فلو - كيس (10 كيلو)",
        description: "مسحوق غسيل قوي للملابس البيضاء والملونة برائحة الياسمين.",
        sku: "YEM-DET-03",
        price: 7500.0,
        moq: 2,
        packingUnit: "كيس",
        stock: 90,
        imageUrl: "/products/detergent.png",
        storeId: store2.id,
        categoryId: catDetergents.id,
      },
      {
        name: "مطهر سائل ومعقم - صندوق (12 حبة × 1 لتر)",
        description: "مطهر عام للأرضيات والأسطح يقضي على 99% من الجراثيم.",
        sku: "YEM-SAN-04",
        price: 14000.0,
        moq: 1,
        packingUnit: "صندوق",
        stock: 45,
        imageUrl: "/products/sanitizer.png",
        storeId: store2.id,
        categoryId: catDetergents.id,
      },
    ],
  });

  console.log("Creating initial sample orders & transactions...");
  const order1 = await prisma.order.create({
    data: {
      retailerId: retailer1.id,
      status: "PENDING",
      total: 33800.0,
      paymentMethod: "WALLET",
      paymentStatus: "PENDING",
      items: {
        create: [
          {
            productId: (await prisma.product.findFirst({ where: { sku: "RAW-TUN-01" } }))!.id,
            quantity: 1,
            price: 24000.0,
          },
          {
            productId: (await prisma.product.findFirst({ where: { sku: "RAW-FAS-02" } }))!.id,
            quantity: 1,
            price: 9800.0,
          },
        ],
      },
    },
  });

  await prisma.transaction.create({
    data: {
      userId: retailer1.id,
      orderId: order1.id,
      amount: 33800.0,
      type: "PAYMENT",
      status: "PENDING",
      reference: "WLT-MOCK-99382",
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
