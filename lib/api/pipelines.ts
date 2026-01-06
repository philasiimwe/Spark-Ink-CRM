
import { supabase } from '../supabase';

export const pipelinesAPI = {
    async getAll() {
        const { data, error } = await supabase
            .from('pipelines')
            .select(`
        *,
        deals:deals(count)
      `)
            .order('order_index');

        if (error) throw error;
        return data;
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('pipelines')
            .select(`
        *,
        deals:deals(*)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async create(pipelineData: {
        name: string;
        description?: string;
        stages: any[];
        color?: string;
        is_default?: boolean;
    }) {
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;

        const { data: user } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', userId)
            .single();

        // If this is set as default, unset other defaults
        if (pipelineData.is_default) {
            await supabase
                .from('pipelines')
                .update({ is_default: false })
                .eq('organization_id', user?.organization_id);
        }

        const { data, error } = await supabase
            .from('pipelines')
            .insert({
                ...pipelineData,
                organization_id: user?.organization_id
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: any) {
        const { data, error } = await supabase
            .from('pipelines')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string) {
        // Check if pipeline has deals
        const { data: deals } = await supabase
            .from('deals')
            .select('id')
            .eq('pipeline_id', id)
            .limit(1);

        if (deals && deals.length > 0) {
            throw new Error('Cannot delete pipeline with active deals. Please reassign deals first.');
        }

        const { error } = await supabase
            .from('pipelines')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async addStage(pipelineId: string, stage: { id: string; label: string; color: string }) {
        const pipeline = await this.getById(pipelineId);
        const stages = [...pipeline.stages, stage];

        return this.update(pipelineId, { stages });
    },

    async removeStage(pipelineId: string, stageId: string) {
        const pipeline = await this.getById(pipelineId);
        const stages = pipeline.stages.filter((s: any) => s.id !== stageId);

        return this.update(pipelineId, { stages });
    },

    async reorderStages(pipelineId: string, stageIds: string[]) {
        const pipeline = await this.getById(pipelineId);

        // Reorder stages based on provided IDs
        const stages = stageIds.map(id =>
            pipeline.stages.find((s: any) => s.id === id)
        ).filter(Boolean);

        return this.update(pipelineId, { stages });
    },

    async getMetrics(pipelineId: string) {
        const { data, error } = await supabase
            .from('deal_pipeline_metrics')
            .select('*')
            .eq('pipeline_id', pipelineId);

        if (error) throw error;
        return data;
    },

    async setDefault(id: string) {
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;

        const { data: user } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', userId)
            .single();

        // Unset all defaults
        await supabase
            .from('pipelines')
            .update({ is_default: false })
            .eq('organization_id', user?.organization_id);

        // Set this one as default
        return this.update(id, { is_default: true });
    }
};
