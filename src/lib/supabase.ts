import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wemomhczwqqnktidooha.supabase.co';
const supabaseKey = 'sb_publishable__5U5bbmht3-_oK0dNO0Ckw_LOzHzglK';

export const supabase = createClient(supabaseUrl, supabaseKey);
