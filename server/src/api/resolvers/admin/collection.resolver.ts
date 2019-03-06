import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import {
    CollectionQueryArgs,
    CollectionsQueryArgs,
    ConfigurableOperation,
    CreateCollectionMutationArgs,
    MoveCollectionMutationArgs,
    Permission,
    UpdateCollectionMutationArgs,
} from '../../../../../shared/generated-types';
import { PaginatedList } from '../../../../../shared/shared-types';
import { Translated } from '../../../common/types/locale-types';
import { CollectionFilter } from '../../../config/collection/collection-filter';
import { Collection } from '../../../entity/collection/collection.entity';
import { CollectionService } from '../../../service/services/collection.service';
import { FacetValueService } from '../../../service/services/facet-value.service';
import { IdCodecService } from '../../common/id-codec.service';
import { RequestContext } from '../../common/request-context';
import { Allow } from '../../decorators/allow.decorator';
import { Decode } from '../../decorators/decode.decorator';
import { Ctx } from '../../decorators/request-context.decorator';

@Resolver()
export class CollectionResolver {
    constructor(
        private collectionService: CollectionService,
        private facetValueService: FacetValueService,
        private idCodecService: IdCodecService,
    ) {}

    @Query()
    @Allow(Permission.ReadCatalog)
    async collectionFilters(
        @Ctx() ctx: RequestContext,
        @Args() args: CollectionsQueryArgs,
    ): Promise<ConfigurableOperation[]> {
        return this.collectionService.getAvailableFilters();
    }

    @Query()
    @Allow(Permission.ReadCatalog)
    async collections(
        @Ctx() ctx: RequestContext,
        @Args() args: CollectionsQueryArgs,
    ): Promise<PaginatedList<Translated<Collection>>> {
        return this.collectionService.findAll(ctx, args.options || undefined);
    }

    @Query()
    @Allow(Permission.ReadCatalog)
    async collection(
        @Ctx() ctx: RequestContext,
        @Args() args: CollectionQueryArgs,
    ): Promise<Translated<Collection> | undefined> {
        return this.collectionService.findOne(ctx, args.id);
    }

    @Mutation()
    @Allow(Permission.CreateCatalog)
    @Decode('assetIds', 'featuredAssetId', 'parentId')
    async createCollection(
        @Ctx() ctx: RequestContext,
        @Args() args: CreateCollectionMutationArgs,
    ): Promise<Translated<Collection>> {
        const { input } = args;
        return this.collectionService.create(ctx, input);
    }

    @Mutation()
    @Allow(Permission.UpdateCatalog)
    @Decode('assetIds', 'featuredAssetId')
    async updateCollection(
        @Ctx() ctx: RequestContext,
        @Args() args: UpdateCollectionMutationArgs,
    ): Promise<Translated<Collection>> {
        const { input } = args;
        return this.collectionService.update(ctx, input);
    }

    @Mutation()
    @Allow(Permission.UpdateCatalog)
    @Decode('categoryId', 'parentId')
    async moveCollection(
        @Ctx() ctx: RequestContext,
        @Args() args: MoveCollectionMutationArgs,
    ): Promise<Translated<Collection>> {
        const { input } = args;
        return this.collectionService.move(ctx, input);
    }
}
