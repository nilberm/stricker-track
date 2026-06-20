"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserCollectionsService = void 0;
var common_1 = require("@nestjs/common");
var database_1 = require("@sticker-track/database");
var shared_1 = require("@sticker-track/shared");
var list_stickers_dto_1 = require("../collections/dto/list-stickers.dto");
var user_collection_dto_1 = require("./dto/user-collection.dto");
var progress_1 = require("./progress");
var UserCollectionsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var UserCollectionsService = _classThis = /** @class */ (function () {
        function UserCollectionsService_1(prisma) {
            this.prisma = prisma;
        }
        UserCollectionsService_1.prototype.start = function (userId, collectionId) {
            return __awaiter(this, void 0, void 0, function () {
                var collection;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.collection.findFirst({
                                where: { id: collectionId, status: database_1.CollectionStatus.PUBLISHED },
                                select: { id: true },
                            })];
                        case 1:
                            collection = _a.sent();
                            if (!collection) {
                                throw new common_1.BadRequestException({
                                    code: 'COLLECTION_NOT_PUBLISHED',
                                    message: 'Collection is not published',
                                });
                            }
                            return [2 /*return*/, this.prisma.userCollection.upsert({
                                    where: { userId_collectionId: { userId: userId, collectionId: collectionId } },
                                    update: {},
                                    create: { userId: userId, collectionId: collectionId },
                                })];
                    }
                });
            });
        };
        UserCollectionsService_1.prototype.list = function (userId, locale) {
            return __awaiter(this, void 0, void 0, function () {
                var userCollections;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.userCollection.findMany({
                                where: { userId: userId },
                                orderBy: { updatedAt: 'desc' },
                                include: {
                                    collection: {
                                        include: {
                                            translations: this.translationFilter(locale),
                                        },
                                    },
                                    userStickers: { select: { quantity: true } },
                                },
                            })];
                        case 1:
                            userCollections = _a.sent();
                            return [2 /*return*/, userCollections.map(function (entry) {
                                    var _a, _b;
                                    return ({
                                        id: entry.id,
                                        startedAt: entry.startedAt,
                                        updatedAt: entry.updatedAt,
                                        collection: {
                                            id: entry.collection.id,
                                            slug: entry.collection.slug,
                                            name: (_b = (_a = entry.collection.translations[0]) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : entry.collection.slug,
                                            totalStickers: entry.collection.totalStickers,
                                            releaseYear: entry.collection.releaseYear,
                                        },
                                        progress: (0, progress_1.calculateProgress)(entry.collection.totalStickers, entry.userStickers),
                                    });
                                })];
                    }
                });
            });
        };
        UserCollectionsService_1.prototype.find = function (userId, userCollectionId, locale) {
            return __awaiter(this, void 0, void 0, function () {
                var entry, knownCodePrefixes;
                var _a, _b, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0: return [4 /*yield*/, this.requireOwnedCollection(userId, userCollectionId, locale)];
                        case 1:
                            entry = _e.sent();
                            return [4 /*yield*/, this.prisma.sticker.findMany({
                                    where: { collectionId: entry.collectionId, prefix: { not: null } },
                                    distinct: ['prefix'],
                                    select: { prefix: true },
                                    orderBy: { prefix: 'asc' },
                                })];
                        case 2:
                            knownCodePrefixes = _e.sent();
                            return [2 /*return*/, {
                                    id: entry.id,
                                    startedAt: entry.startedAt,
                                    updatedAt: entry.updatedAt,
                                    collection: {
                                        id: entry.collection.id,
                                        slug: entry.collection.slug,
                                        name: (_b = (_a = entry.collection.translations[0]) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : entry.collection.slug,
                                        description: (_d = (_c = entry.collection.translations[0]) === null || _c === void 0 ? void 0 : _c.description) !== null && _d !== void 0 ? _d : null,
                                        totalStickers: entry.collection.totalStickers,
                                        releaseYear: entry.collection.releaseYear,
                                        codeConfig: {
                                            pattern: entry.collection.codePattern,
                                            example: entry.collection.codeExample,
                                            prefixMinLength: entry.collection.codePrefixMinLength,
                                            prefixMaxLength: entry.collection.codePrefixMaxLength,
                                            numberMinLength: entry.collection.codeNumberMinLength,
                                            numberMaxLength: entry.collection.codeNumberMaxLength,
                                        },
                                        knownCodePrefixes: knownCodePrefixes
                                            .map(function (_a) {
                                            var prefix = _a.prefix;
                                            return prefix;
                                        })
                                            .filter(function (prefix) { return Boolean(prefix); }),
                                    },
                                }];
                    }
                });
            });
        };
        UserCollectionsService_1.prototype.progress = function (userId, userCollectionId, locale) {
            return __awaiter(this, void 0, void 0, function () {
                var entry, _a, records, sections, recent;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.requireOwnedCollection(userId, userCollectionId, locale)];
                        case 1:
                            entry = _b.sent();
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.userSticker.findMany({
                                        where: { userCollectionId: userCollectionId },
                                        select: { quantity: true },
                                    }),
                                    this.prisma.collectionSection.findMany({
                                        where: { collectionId: entry.collectionId },
                                        orderBy: { order: 'asc' },
                                        include: {
                                            translations: this.translationFilter(locale),
                                            stickers: {
                                                select: {
                                                    id: true,
                                                    userStickers: {
                                                        where: { userCollectionId: userCollectionId },
                                                        select: { quantity: true },
                                                    },
                                                },
                                            },
                                        },
                                    }),
                                    this.prisma.userSticker.findMany({
                                        where: { userCollectionId: userCollectionId, quantity: { gt: 0 } },
                                        orderBy: { updatedAt: 'desc' },
                                        take: 6,
                                        include: {
                                            sticker: {
                                                include: {
                                                    section: {
                                                        include: { translations: this.translationFilter(locale) },
                                                    },
                                                },
                                            },
                                        },
                                    }),
                                ])];
                        case 2:
                            _a = _b.sent(), records = _a[0], sections = _a[1], recent = _a[2];
                            return [2 /*return*/, __assign(__assign({}, (0, progress_1.calculateProgress)(entry.collection.totalStickers, records)), { sections: sections.map(function (section) {
                                        var _a, _b, _c, _d;
                                        var sectionRecords = section.stickers
                                            .map(function (sticker) { return sticker.userStickers[0]; })
                                            .filter(function (record) { return Boolean(record); });
                                        var summary = (0, progress_1.calculateProgress)(section.stickers.length, sectionRecords);
                                        return {
                                            sectionId: section.id,
                                            code: section.code,
                                            type: section.type,
                                            countryIso2: (_a = section.countryIso2) !== null && _a !== void 0 ? _a : undefined,
                                            name: (_d = (_c = (_b = section.translations[0]) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : section.code) !== null && _d !== void 0 ? _d : '',
                                            total: summary.totalStickers,
                                            owned: summary.ownedUnique,
                                            missing: summary.missing,
                                            duplicates: summary.duplicates,
                                            percentage: summary.completionPercentage,
                                        };
                                    }), recent: recent.map(function (record) {
                                        var _a, _b, _c, _d, _e;
                                        return ({
                                            stickerId: record.stickerId,
                                            code: record.sticker.code,
                                            name: record.sticker.name,
                                            quantity: record.quantity,
                                            updatedAt: record.updatedAt,
                                            section: (_e = (_c = (_b = (_a = record.sticker.section) === null || _a === void 0 ? void 0 : _a.translations[0]) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : (_d = record.sticker.section) === null || _d === void 0 ? void 0 : _d.code) !== null && _e !== void 0 ? _e : null,
                                        });
                                    }) })];
                    }
                });
            });
        };
        UserCollectionsService_1.prototype.listStickers = function (userId, userCollectionId, query) {
            return __awaiter(this, void 0, void 0, function () {
                var entry, sectionExists, quantityFilter, normalizedSearch, where, orderBy, _a, data, total;
                var _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.requireOwnedCollection(userId, userCollectionId, query.locale)];
                        case 1:
                            entry = _c.sent();
                            if (!query.sectionId) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.prisma.collectionSection.findUnique({
                                    where: { id: query.sectionId },
                                    select: { collectionId: true },
                                })];
                        case 2:
                            sectionExists = _c.sent();
                            if (!sectionExists || sectionExists.collectionId !== entry.collectionId) {
                                throw new common_1.NotFoundException('Section not found in this collection');
                            }
                            _c.label = 3;
                        case 3:
                            quantityFilter = this.quantityFilter(query.status);
                            normalizedSearch = query.search
                                ? (0, shared_1.normalizeStickerCode)(query.search)
                                : null;
                            where = __assign(__assign(__assign(__assign({ collectionId: entry.collectionId }, (query.sectionId ? { sectionId: query.sectionId } : {})), (query.type ? { type: query.type } : {})), (query.search
                                ? {
                                    OR: __spreadArray(__spreadArray([
                                        { code: { contains: query.search, mode: 'insensitive' } }
                                    ], (normalizedSearch
                                        ? [{ normalizedCode: normalizedSearch }]
                                        : []), true), [
                                        { name: { contains: query.search, mode: 'insensitive' } },
                                        {
                                            player: {
                                                name: { contains: query.search, mode: 'insensitive' },
                                            },
                                        },
                                    ], false),
                                }
                                : {})), (quantityFilter
                                ? {
                                    userStickers: (_b = {},
                                        _b[quantityFilter.operator] = {
                                            userCollectionId: userCollectionId,
                                            quantity: quantityFilter.quantity,
                                        },
                                        _b),
                                }
                                : {}));
                            orderBy = query.sort === list_stickers_dto_1.StickerSort.CODE
                                ? { code: 'asc' }
                                : query.sort === list_stickers_dto_1.StickerSort.NAME
                                    ? { name: 'asc' }
                                    : { albumOrder: 'asc' };
                            return [4 /*yield*/, this.prisma.$transaction([
                                    this.prisma.sticker.findMany({
                                        where: where,
                                        orderBy: orderBy,
                                        skip: (query.page - 1) * query.limit,
                                        take: query.limit,
                                        include: {
                                            section: {
                                                include: { translations: this.translationFilter(query.locale) },
                                            },
                                            player: {
                                                include: {
                                                    images: {
                                                        where: {
                                                            isPrimary: true,
                                                            reviewStatus: database_1.ImageReviewStatus.APPROVED,
                                                        },
                                                        take: 1,
                                                    },
                                                },
                                            },
                                            userStickers: {
                                                where: { userCollectionId: userCollectionId },
                                                take: 1,
                                            },
                                        },
                                    }),
                                    this.prisma.sticker.count({ where: where }),
                                ])];
                        case 4:
                            _a = _c.sent(), data = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    data: data.map(function (sticker) {
                                        var _a, _b, _c, _d, _e;
                                        var quantity = (_b = (_a = sticker.userStickers[0]) === null || _a === void 0 ? void 0 : _a.quantity) !== null && _b !== void 0 ? _b : 0;
                                        return {
                                            id: sticker.id,
                                            code: sticker.code,
                                            name: sticker.name,
                                            type: sticker.type,
                                            albumOrder: sticker.albumOrder,
                                            sectionOrder: sticker.sectionOrder,
                                            quantity: quantity,
                                            owned: quantity > 0,
                                            duplicateCount: Math.max(quantity - 1, 0),
                                            section: sticker.section
                                                ? {
                                                    id: sticker.section.id,
                                                    name: (_e = (_d = (_c = sticker.section.translations[0]) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : sticker.section.code) !== null && _e !== void 0 ? _e : '',
                                                }
                                                : null,
                                            player: sticker.player
                                                ? {
                                                    id: sticker.player.id,
                                                    name: sticker.player.name,
                                                    displayName: sticker.player.displayName,
                                                    image: sticker.player.images[0]
                                                        ? { url: sticker.player.images[0].url }
                                                        : null,
                                                }
                                                : null,
                                        };
                                    }),
                                    pagination: {
                                        page: query.page,
                                        limit: query.limit,
                                        total: total,
                                        totalPages: Math.max(1, Math.ceil(total / query.limit)),
                                    },
                                }];
                    }
                });
            });
        };
        UserCollectionsService_1.prototype.setQuantity = function (userId, userCollectionId, stickerId, quantity) {
            var _this = this;
            return this.prisma.$transaction(function (transaction) { return __awaiter(_this, void 0, void 0, function () {
                var now, record;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.assertMutationAccess(transaction, userId, userCollectionId, stickerId)];
                        case 1:
                            _a.sent();
                            if (!(quantity === 0)) return [3 /*break*/, 3];
                            return [4 /*yield*/, transaction.userSticker.deleteMany({
                                    where: { userCollectionId: userCollectionId, stickerId: stickerId },
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { stickerId: stickerId, quantity: 0, owned: false, duplicateCount: 0 }];
                        case 3:
                            now = new Date();
                            return [4 /*yield*/, transaction.userSticker.upsert({
                                    where: { userCollectionId_stickerId: { userCollectionId: userCollectionId, stickerId: stickerId } },
                                    create: {
                                        userCollectionId: userCollectionId,
                                        stickerId: stickerId,
                                        quantity: quantity,
                                        firstAcquiredAt: now,
                                        lastAcquiredAt: now,
                                    },
                                    update: { quantity: quantity, lastAcquiredAt: now },
                                })];
                        case 4:
                            record = _a.sent();
                            return [2 /*return*/, this.quantityResponse(record.stickerId, record.quantity)];
                    }
                });
            }); });
        };
        UserCollectionsService_1.prototype.increment = function (userId, userCollectionId, stickerId, amount) {
            var _this = this;
            return this.prisma.$transaction(function (transaction) { return __awaiter(_this, void 0, void 0, function () {
                var now, record;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.assertMutationAccess(transaction, userId, userCollectionId, stickerId)];
                        case 1:
                            _a.sent();
                            now = new Date();
                            return [4 /*yield*/, transaction.userSticker.upsert({
                                    where: {
                                        userCollectionId_stickerId: { userCollectionId: userCollectionId, stickerId: stickerId },
                                    },
                                    create: {
                                        userCollectionId: userCollectionId,
                                        stickerId: stickerId,
                                        quantity: amount,
                                        firstAcquiredAt: now,
                                        lastAcquiredAt: now,
                                    },
                                    update: {
                                        quantity: { increment: amount },
                                        lastAcquiredAt: now,
                                    },
                                })];
                        case 2:
                            record = _a.sent();
                            return [2 /*return*/, this.quantityResponse(record.stickerId, record.quantity)];
                    }
                });
            }); });
        };
        UserCollectionsService_1.prototype.decrement = function (userId, userCollectionId, stickerId, amount) {
            var _this = this;
            return this.prisma.$transaction(function (transaction) { return __awaiter(_this, void 0, void 0, function () {
                var record, currentQuantity, nextQuantity, updated;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.assertMutationAccess(transaction, userId, userCollectionId, stickerId)];
                        case 1:
                            _b.sent();
                            return [4 /*yield*/, transaction.userSticker.findUnique({
                                    where: {
                                        userCollectionId_stickerId: { userCollectionId: userCollectionId, stickerId: stickerId },
                                    },
                                })];
                        case 2:
                            record = _b.sent();
                            currentQuantity = (_a = record === null || record === void 0 ? void 0 : record.quantity) !== null && _a !== void 0 ? _a : 0;
                            if (currentQuantity < amount) {
                                throw new common_1.BadRequestException({
                                    code: 'QUANTITY_CANNOT_BE_NEGATIVE',
                                    message: 'Quantity cannot be negative',
                                });
                            }
                            nextQuantity = currentQuantity - amount;
                            if (!(nextQuantity === 0)) return [3 /*break*/, 4];
                            return [4 /*yield*/, transaction.userSticker.deleteMany({
                                    where: { userCollectionId: userCollectionId, stickerId: stickerId },
                                })];
                        case 3:
                            _b.sent();
                            return [2 /*return*/, this.quantityResponse(stickerId, 0)];
                        case 4: return [4 /*yield*/, transaction.userSticker.update({
                                where: {
                                    userCollectionId_stickerId: { userCollectionId: userCollectionId, stickerId: stickerId },
                                },
                                data: {
                                    quantity: { decrement: amount },
                                    lastAcquiredAt: new Date(),
                                },
                            })];
                        case 5:
                            updated = _b.sent();
                            return [2 /*return*/, this.quantityResponse(updated.stickerId, updated.quantity)];
                    }
                });
            }); }, { isolationLevel: database_1.Prisma.TransactionIsolationLevel.Serializable });
        };
        UserCollectionsService_1.prototype.remove = function (userId, userCollectionId, stickerId) {
            return this.setQuantity(userId, userCollectionId, stickerId, 0);
        };
        UserCollectionsService_1.prototype.requireOwnedCollection = function (userId, userCollectionId, locale) {
            return __awaiter(this, void 0, void 0, function () {
                var entry;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.userCollection.findUnique({
                                where: { id: userCollectionId },
                                include: {
                                    collection: {
                                        include: { translations: this.translationFilter(locale) },
                                    },
                                },
                            })];
                        case 1:
                            entry = _a.sent();
                            if (!entry) {
                                throw new common_1.NotFoundException({
                                    code: 'USER_COLLECTION_NOT_FOUND',
                                    message: 'User collection not found',
                                });
                            }
                            if (entry.userId !== userId) {
                                throw new common_1.ForbiddenException({
                                    code: 'FORBIDDEN_USER_COLLECTION',
                                    message: 'User collection belongs to another user',
                                });
                            }
                            return [2 /*return*/, entry];
                    }
                });
            });
        };
        UserCollectionsService_1.prototype.assertMutationAccess = function (transaction, userId, userCollectionId, stickerId) {
            return __awaiter(this, void 0, void 0, function () {
                var userCollection, stickerExists;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, transaction.userCollection.findUnique({
                                where: { id: userCollectionId },
                                select: { userId: true, collectionId: true },
                            })];
                        case 1:
                            userCollection = _a.sent();
                            if (!userCollection) {
                                throw new common_1.NotFoundException({
                                    code: 'USER_COLLECTION_NOT_FOUND',
                                    message: 'User collection not found',
                                });
                            }
                            if (userCollection.userId !== userId) {
                                throw new common_1.ForbiddenException({
                                    code: 'FORBIDDEN_USER_COLLECTION',
                                    message: 'User collection belongs to another user',
                                });
                            }
                            return [4 /*yield*/, transaction.sticker.count({
                                    where: { id: stickerId, collectionId: userCollection.collectionId },
                                })];
                        case 2:
                            stickerExists = _a.sent();
                            if (!stickerExists) {
                                throw new common_1.BadRequestException({
                                    code: 'STICKER_NOT_IN_COLLECTION',
                                    message: 'Sticker does not belong to this collection',
                                });
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        UserCollectionsService_1.prototype.quantityFilter = function (status) {
            if (status === user_collection_dto_1.PersonalStickerStatus.OWNED) {
                return { operator: 'some', quantity: { gt: 0 } };
            }
            if (status === user_collection_dto_1.PersonalStickerStatus.DUPLICATES) {
                return { operator: 'some', quantity: { gt: 1 } };
            }
            if (status === user_collection_dto_1.PersonalStickerStatus.MISSING) {
                return { operator: 'none', quantity: { gt: 0 } };
            }
            return null;
        };
        UserCollectionsService_1.prototype.quantityResponse = function (stickerId, quantity) {
            return {
                stickerId: stickerId,
                quantity: quantity,
                owned: quantity > 0,
                duplicateCount: Math.max(quantity - 1, 0),
            };
        };
        UserCollectionsService_1.prototype.translationFilter = function (locale) {
            var requested = shared_1.localeToDatabase[locale];
            var fallbackLocales = [
                requested,
                database_1.SupportedLocale.PT_BR,
            ];
            return {
                where: { locale: { in: fallbackLocales } },
                orderBy: {
                    locale: requested === database_1.SupportedLocale.PT_BR
                        ? database_1.Prisma.SortOrder.asc
                        : database_1.Prisma.SortOrder.desc,
                },
            };
        };
        return UserCollectionsService_1;
    }());
    __setFunctionName(_classThis, "UserCollectionsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UserCollectionsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UserCollectionsService = _classThis;
}();
exports.UserCollectionsService = UserCollectionsService;
