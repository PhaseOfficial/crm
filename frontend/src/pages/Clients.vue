<template>
  <div class="flex flex-col flex-1 h-full overflow-hidden bg-surface-gray-2">
    <!-- Top Layout Header -->
    <LayoutHeader>
      <template #left-header>
        <div class="flex items-center gap-2">
          <div class="size-8 rounded-lg bg-surface-blue-2 border border-outline-blue-2 flex items-center justify-center text-ink-blue-7">
            <span class="lucide-building size-4" />
          </div>
          <div>
            <h1 class="text-lg font-bold text-ink-gray-9 leading-none">
              {{ __('Clients') }}
            </h1>
            <span class="text-xs text-ink-gray-5">
              {{ __('Organizations, associated contact people, and portal verification requests') }}
            </span>
          </div>
        </div>
      </template>

      <template #right-header>
        <div class="flex items-center gap-2">
          <div class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-base border border-outline-gray-1 text-[11px] text-ink-gray-6 shadow-xs">
            <span class="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span class="font-medium">{{ __('Supabase Connected') }}</span>
          </div>
          <Button
            variant="subtle"
            iconLeft="refresh-cw"
            :loading="business.isFetchingClients"
            :label="__('Sync')"
            @click="refreshSupabaseData"
          />
          <Button
            v-if="business.pendingChangeRequests.length"
            variant="subtle"
            theme="amber"
            iconLeft="clock"
            :label="__('{0} Pending Approvals', [business.pendingChangeRequests.length])"
            @click="activeTab = 'pending'"
          />
          <Button
            variant="solid"
            iconLeft="plus"
            :label="__('Add Client')"
            @click="openAddClientModal"
          />
        </div>
      </template>
    </LayoutHeader>

    <!-- Main Content Container with Tabs -->
    <div class="flex flex-col flex-1 overflow-hidden p-6 space-y-5">
      <!-- Tabs Bar -->
      <div class="flex items-center justify-between border-b border-outline-gray-1 pb-3">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2"
            :class="activeTab === 'all' ? 'bg-surface-base text-ink-gray-9 shadow-sm border border-outline-gray-1 font-bold' : 'text-ink-gray-5 hover:text-ink-gray-9 hover:bg-surface-base/50'"
            @click="activeTab = 'all'"
          >
            <span class="lucide-building-2 size-3.5" />
            <span>{{ __('All Clients') }}</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-surface-gray-3 text-ink-gray-7">
              {{ filteredClients.length }}
            </span>
          </button>

          <button
            type="button"
            class="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2"
            :class="activeTab === 'pending' ? 'bg-surface-base text-ink-gray-9 shadow-sm border border-outline-gray-1 font-bold' : 'text-ink-gray-5 hover:text-ink-gray-9 hover:bg-surface-base/50'"
            @click="activeTab = 'pending'"
          >
            <span class="lucide-clock size-3.5 text-amber-500" />
            <span>{{ __('Pending Approvals') }}</span>
            <span
              v-if="business.pendingChangeRequests.length"
              class="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-surface-amber-2 text-ink-amber-7 border border-outline-amber-2"
            >
              {{ business.pendingChangeRequests.length }}
            </span>
          </button>

          <button
            type="button"
            class="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2"
            :class="activeTab === 'history' ? 'bg-surface-base text-ink-gray-9 shadow-sm border border-outline-gray-1 font-bold' : 'text-ink-gray-5 hover:text-ink-gray-9 hover:bg-surface-base/50'"
            @click="activeTab = 'history'"
          >
            <span class="lucide-history size-3.5" />
            <span>{{ __('Change Request History') }}</span>
          </button>
        </div>

        <!-- Search Bar (Active in All Clients) -->
        <div v-if="activeTab === 'all'" class="relative w-64">
          <span class="lucide-search absolute left-3 top-2.5 size-4 text-ink-gray-4" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="__('Search organization or contact...')"
            class="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-base border border-outline-gray-1 rounded-lg text-ink-gray-9 placeholder-ink-gray-4 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <!-- TAB 1: ALL CLIENTS DIRECTORY -->
      <div v-if="activeTab === 'all'" class="flex-1 overflow-y-auto space-y-4">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div
            v-for="c in filteredClients"
            :key="c.id"
            class="bg-surface-base border border-outline-gray-1 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
          >
            <!-- Card Header: Organization Details -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3">
                <div class="size-11 rounded-xl bg-surface-blue-2 border border-outline-blue-2 flex items-center justify-center font-bold text-ink-blue-7 text-sm shrink-0">
                  {{ (c.company_name || 'C').substring(0, 2).toUpperCase() }}
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="text-sm font-bold text-ink-gray-9">
                      {{ c.company_name }}
                    </h3>
                    <span
                      class="px-2 py-0.5 rounded text-[10px] font-bold"
                      :class="c.status === 'Active' ? 'bg-surface-green-2 text-ink-green-7 border border-outline-green-2' : 'bg-surface-gray-2 text-ink-gray-6 border border-outline-gray-2'"
                    >
                      {{ __(c.status || 'Active') }}
                    </span>
                    <span v-if="c.legal_structure" class="text-[10px] text-ink-gray-5 bg-surface-gray-2 px-1.5 py-0.5 rounded">
                      {{ c.legal_structure }}
                    </span>
                  </div>

                  <p v-if="c.industry" class="text-xs text-ink-gray-5 mt-0.5">
                    {{ c.industry }}
                  </p>

                  <div class="flex items-center gap-3 mt-1.5 text-xs text-ink-gray-6 flex-wrap">
                    <span v-if="c.company_registration_number" class="font-mono text-[11px] bg-surface-gray-1 px-1.5 py-0.5 rounded border border-outline-gray-1">
                      CRN: {{ c.company_registration_number }}
                    </span>
                    <span v-if="c.tin" class="font-mono text-[11px] bg-surface-gray-1 px-1.5 py-0.5 rounded border border-outline-gray-1">
                      TIN: {{ c.tin }}
                    </span>
                    <span v-if="c.billing_city" class="flex items-center gap-1 text-ink-gray-5">
                      <span class="lucide-map-pin size-3" />
                      {{ c.billing_city }}, {{ c.billing_country || 'US' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Action Menu -->
              <div class="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="subtle"
                  iconLeft="file-edit"
                  :label="__('Edit')"
                  @click="openEditClientModal(c)"
                />
                <Button
                  size="sm"
                  variant="subtle"
                  iconLeft="user-plus"
                  :label="__('Upgrade to Staff')"
                  @click="promptUpgradeClient(c)"
                />
              </div>
            </div>

            <!-- Card Body: Associated Contact People -->
            <div class="bg-surface-gray-1 rounded-xl p-3 border border-outline-gray-1 space-y-2">
              <span class="text-[10px] font-bold uppercase tracking-wider text-ink-gray-5 flex items-center gap-1.5">
                <span class="lucide-users size-3" />
                {{ __('Primary Contact Person & Representatives') }}
              </span>

              <div class="space-y-1.5">
                <!-- Primary Contact -->
                <div class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2">
                    <span class="lucide-user-check size-3.5 text-ink-blue-6 shrink-0" />
                    <span class="font-bold text-ink-gray-9">
                      {{ c.first_name ? `${c.first_name} ${c.last_name || ''}` : (c.contact_name || c.primary_email) }}
                    </span>
                    <span v-if="c.job_title" class="text-[11px] text-ink-gray-5">({{ c.job_title }})</span>
                  </div>
                  <span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-surface-blue-2 text-ink-blue-7">
                    {{ __('Primary') }}
                  </span>
                </div>

                <div class="grid grid-cols-2 gap-2 text-[11px] text-ink-gray-6 pl-5.5">
                  <span class="truncate flex items-center gap-1">
                    <span class="lucide-mail size-3 text-ink-gray-4" />
                    {{ c.billing_email || c.primary_email }}
                  </span>
                  <span class="truncate flex items-center gap-1">
                    <span class="lucide-phone size-3 text-ink-gray-4" />
                    {{ c.phone || c.mobile_no || 'No phone' }}
                  </span>
                </div>

                <!-- Secondary Contacts (if any) -->
                <div v-if="c.contacts && c.contacts.length > 1" class="pt-1 border-t border-outline-gray-1">
                  <div
                    v-for="cnt in c.contacts.filter(item => !item.is_primary)"
                    :key="cnt.id"
                    class="flex items-center justify-between text-[11px] text-ink-gray-7 py-0.5"
                  >
                    <span class="flex items-center gap-1.5">
                      <span class="lucide-user size-3 text-ink-gray-4" />
                      {{ cnt.name }} <span class="text-ink-gray-4">({{ cnt.role }})</span>
                    </span>
                    <span class="text-ink-gray-5">{{ cnt.email }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card Footer: Commercial & Invoice Stats -->
            <div class="flex items-center justify-between pt-2 border-t border-outline-gray-1 text-xs">
              <div class="flex items-center gap-3 text-ink-gray-5">
                <span>Terms: <strong class="text-ink-gray-9">{{ c.default_payment_terms || 'Net 30' }}</strong></span>
                <span>Currency: <strong class="text-ink-gray-9">{{ c.default_currency || 'USD' }}</strong></span>
                <span v-if="c.credit_limit">Limit: <strong class="text-ink-gray-9">${{ Number(c.credit_limit).toLocaleString() }}</strong></span>
              </div>

              <router-link :to="`/invoices/new?customer=${encodeURIComponent(c.company_name)}&email=${encodeURIComponent(c.primary_email)}`">
                <Button size="sm" variant="subtle" iconLeft="plus" :label="__('Issue Invoice')" />
              </router-link>
            </div>
          </div>
        </div>

        <div v-if="!filteredClients.length" class="bg-surface-base border border-outline-gray-1 rounded-xl p-12 text-center text-ink-gray-5 space-y-2">
          <span class="lucide-building size-8 text-ink-gray-4 mx-auto" />
          <h4 class="text-sm font-bold text-ink-gray-9">{{ __('No Clients Found') }}</h4>
          <p class="text-xs text-ink-gray-5">{{ __('Try adjusting your search query or click "Add Client" to create a new client organization.') }}</p>
        </div>
      </div>

      <!-- TAB 2: PENDING APPROVALS QUEUE -->
      <div v-if="activeTab === 'pending'" class="flex-1 overflow-y-auto space-y-4">
        <div v-if="business.pendingChangeRequests.length" class="space-y-4">
          <div
            v-for="req in business.pendingChangeRequests"
            :key="req.id"
            class="bg-surface-base border border-outline-amber-2 rounded-xl p-5 shadow-sm space-y-4"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-gray-1 pb-3">
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-bold text-ink-gray-9">{{ req.organization }}</h3>
                  <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-surface-amber-2 text-ink-amber-7 border border-outline-amber-2">
                    {{ __('Pending Verification') }}
                  </span>
                </div>
                <p class="text-xs text-ink-gray-5 mt-0.5">
                  {{ __('Submitted by {0} ({1}) on {2}', [req.client_name, req.client_email, req.requested_date]) }}
                </p>
              </div>

              <div class="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="subtle"
                  theme="red"
                  iconLeft="x"
                  :label="__('Reject')"
                  @click="openRejectModal(req)"
                />
                <Button
                  size="sm"
                  variant="solid"
                  theme="green"
                  iconLeft="check"
                  :label="__('Approve Updates')"
                  @click="approveRequest(req.id)"
                />
              </div>
            </div>

            <!-- Client Reason -->
            <div class="bg-surface-gray-1 p-3 rounded-lg text-xs text-ink-gray-8">
              <span class="font-bold text-ink-gray-9 block">{{ __('Client Reason for Request:') }}</span>
              <p class="mt-0.5">{{ req.reason }}</p>
            </div>

            <!-- Comparison Table: Current vs Requested -->
            <div class="border border-outline-gray-1 rounded-lg overflow-hidden">
              <table class="w-full text-left text-xs border-collapse">
                <thead class="bg-surface-gray-2 text-ink-gray-6 uppercase tracking-wider font-semibold border-b border-outline-gray-1">
                  <tr>
                    <th class="py-2.5 px-4 w-1/4">{{ __('Field') }}</th>
                    <th class="py-2.5 px-4 w-3/8">{{ __('Current Verified Record') }}</th>
                    <th class="py-2.5 px-4 w-3/8 bg-surface-blue-1/50 text-ink-blue-8">{{ __('Requested New Value') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-gray-1">
                  <tr v-if="req.requested_details.company && req.requested_details.company !== req.current_details.company">
                    <td class="py-2 px-4 font-semibold text-ink-gray-7">{{ __('Company Name') }}</td>
                    <td class="py-2 px-4 text-ink-gray-5 line-through">{{ req.current_details.company || '—' }}</td>
                    <td class="py-2 px-4 font-bold text-ink-blue-7 bg-surface-blue-1/30">{{ req.requested_details.company }}</td>
                  </tr>

                  <tr v-if="req.requested_details.company_registration_number && req.requested_details.company_registration_number !== req.current_details.company_registration_number">
                    <td class="py-2 px-4 font-semibold text-ink-gray-7">{{ __('Company Reg. Number (CRN)') }}</td>
                    <td class="py-2 px-4 text-ink-gray-5 line-through">{{ req.current_details.company_registration_number || '—' }}</td>
                    <td class="py-2 px-4 font-bold text-ink-blue-7 bg-surface-blue-1/30">{{ req.requested_details.company_registration_number }}</td>
                  </tr>

                  <tr v-if="req.requested_details.tax_id && req.requested_details.tax_id !== req.current_details.tax_id">
                    <td class="py-2 px-4 font-semibold text-ink-gray-7">{{ __('Tax ID / TIN / VAT') }}</td>
                    <td class="py-2 px-4 text-ink-gray-5 line-through">{{ req.current_details.tax_id || '—' }}</td>
                    <td class="py-2 px-4 font-bold text-ink-blue-7 bg-surface-blue-1/30">{{ req.requested_details.tax_id }}</td>
                  </tr>

                  <tr v-if="req.requested_details.full_name && req.requested_details.full_name !== req.current_details.full_name">
                    <td class="py-2 px-4 font-semibold text-ink-gray-7">{{ __('Contact Full Name') }}</td>
                    <td class="py-2 px-4 text-ink-gray-5 line-through">{{ req.current_details.full_name || '—' }}</td>
                    <td class="py-2 px-4 font-bold text-ink-blue-7 bg-surface-blue-1/30">{{ req.requested_details.full_name }}</td>
                  </tr>

                  <tr v-if="req.requested_details.phone && req.requested_details.phone !== req.current_details.phone">
                    <td class="py-2 px-4 font-semibold text-ink-gray-7">{{ __('Phone Number') }}</td>
                    <td class="py-2 px-4 text-ink-gray-5 line-through">{{ req.current_details.phone || '—' }}</td>
                    <td class="py-2 px-4 font-bold text-ink-blue-7 bg-surface-blue-1/30">{{ req.requested_details.phone }}</td>
                  </tr>

                  <tr v-if="req.requested_details.address && req.requested_details.address !== req.current_details.address">
                    <td class="py-2 px-4 font-semibold text-ink-gray-7">{{ __('Billing Address') }}</td>
                    <td class="py-2 px-4 text-ink-gray-5 line-through">{{ req.current_details.address || '—' }}</td>
                    <td class="py-2 px-4 font-bold text-ink-blue-7 bg-surface-blue-1/30">{{ req.requested_details.address }}</td>
                  </tr>

                  <tr v-if="req.requested_details.city && req.requested_details.city !== req.current_details.city">
                    <td class="py-2 px-4 font-semibold text-ink-gray-7">{{ __('City / Postal Code') }}</td>
                    <td class="py-2 px-4 text-ink-gray-5 line-through">{{ req.current_details.city }} {{ req.current_details.zip }}</td>
                    <td class="py-2 px-4 font-bold text-ink-blue-7 bg-surface-blue-1/30">{{ req.requested_details.city }} {{ req.requested_details.zip }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div v-else class="bg-surface-base border border-outline-gray-1 rounded-xl p-12 text-center text-ink-gray-5 space-y-2">
          <span class="lucide-check-circle-2 size-8 text-emerald-500 mx-auto" />
          <h4 class="text-sm font-bold text-ink-gray-9">{{ __('All Caught Up!') }}</h4>
          <p class="text-xs text-ink-gray-5">{{ __('There are no pending client profile change requests waiting for approval.') }}</p>
        </div>
      </div>

      <!-- TAB 3: CHANGE REQUEST HISTORY -->
      <div v-if="activeTab === 'history'" class="flex-1 overflow-y-auto">
        <div class="bg-surface-base border border-outline-gray-1 rounded-xl overflow-hidden shadow-sm">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-surface-gray-2 text-ink-gray-6 uppercase tracking-wider font-semibold border-b border-outline-gray-1">
              <tr>
                <th class="py-3 px-4">{{ __('Date') }}</th>
                <th class="py-3 px-4">{{ __('Client Organization') }}</th>
                <th class="py-3 px-4">{{ __('Requested Updates') }}</th>
                <th class="py-3 px-4">{{ __('Status') }}</th>
                <th class="py-3 px-4">{{ __('Reviewer & Notes') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-gray-1">
              <tr v-for="req in business.changeRequests" :key="req.id" class="hover:bg-surface-gray-1">
                <td class="py-3 px-4 text-ink-gray-5 whitespace-nowrap">{{ req.requested_date }}</td>
                <td class="py-3 px-4">
                  <span class="font-bold text-ink-gray-9 block">{{ req.organization }}</span>
                  <span class="text-ink-gray-5">{{ req.client_name }}</span>
                </td>
                <td class="py-3 px-4">
                  <div class="space-y-0.5">
                    <span v-if="req.requested_details.company !== req.current_details.company" class="block">
                      Company: <strong>{{ req.requested_details.company }}</strong>
                    </span>
                    <span v-if="req.requested_details.company_registration_number !== req.current_details.company_registration_number" class="block">
                      CRN: <strong>{{ req.requested_details.company_registration_number }}</strong>
                    </span>
                    <span v-if="req.requested_details.tax_id !== req.current_details.tax_id" class="block">
                      TIN: <strong>{{ req.requested_details.tax_id }}</strong>
                    </span>
                    <span v-if="req.requested_details.address !== req.current_details.address" class="block">
                      Address: <strong>{{ req.requested_details.address }}</strong>
                    </span>
                  </div>
                </td>
                <td class="py-3 px-4 whitespace-nowrap">
                  <span
                    class="px-2 py-0.5 rounded text-[10px] font-bold"
                    :class="{
                      'bg-surface-amber-2 text-ink-amber-7 border border-outline-amber-2': req.status === 'Pending',
                      'bg-surface-green-2 text-ink-green-7 border border-outline-green-2': req.status === 'Approved',
                      'bg-surface-red-2 text-ink-red-7 border border-outline-red-2': req.status === 'Rejected',
                    }"
                  >
                    {{ __(req.status) }}
                  </span>
                </td>
                <td class="py-3 px-4 text-ink-gray-6">
                  <span v-if="req.reviewed_by" class="block font-semibold text-ink-gray-9">
                    {{ req.reviewed_by }} ({{ req.reviewed_date }})
                  </span>
                  <span>{{ req.review_notes || '—' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL: ADD / EDIT CLIENT ORGANIZATION & CONTACT -->
    <Dialog v-model:open="showClientModal" :size="'2xl'">
      <template #body>
        <div class="p-6 bg-surface-base text-ink-gray-9 space-y-6 max-h-[85vh] overflow-y-auto">
          <div class="border-b border-outline-gray-1 pb-3 flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold text-ink-gray-9">
                {{ isEditing ? __('Edit Client Organization & Contacts') : __('Add New Client Organization') }}
              </h2>
              <p class="text-xs text-ink-gray-5 mt-0.5">
                {{ __('Create the legal entity organization and assign their primary contact representative') }}
              </p>
            </div>
            <button
              type="button"
              class="text-ink-gray-4 hover:text-ink-gray-9"
              @click="showClientModal = false"
            >
              <span class="lucide-x size-5" />
            </button>
          </div>

          <form class="space-y-6" @submit.prevent="saveClient">
            <!-- Section 1: Organization Details -->
            <div class="space-y-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-ink-blue-7 flex items-center gap-1.5 border-b border-outline-gray-1 pb-1">
                <span class="lucide-building size-4" />
                {{ __('1. Organization Legal Entity Details') }}
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormControl
                  v-model="clientForm.company_name"
                  :label="__('Organization / Company Name')"
                  placeholder="e.g. Acme Corporation"
                  type="text"
                  required
                />
                <FormControl
                  v-model="clientForm.legal_structure"
                  :label="__('Legal Structure')"
                  type="select"
                  :options="[
                    { label: 'Corporation (Inc / Corp)', value: 'Corporation' },
                    { label: 'Limited Liability Company (LLC)', value: 'LLC' },
                    { label: 'Private Limited (Ltd)', value: 'Ltd' },
                    { label: 'Public Limited Company (PLC)', value: 'PLC' },
                    { label: 'Partnership', value: 'Partnership' },
                    { label: 'Sole Proprietorship', value: 'Sole Proprietorship' },
                    { label: 'Non-Profit / NGO', value: 'Non-Profit' },
                  ]"
                />
                <FormControl
                  v-model="clientForm.company_registration_number"
                  :label="__('Company Registration Number (CRN)')"
                  placeholder="e.g. CRN-881920-CA"
                  type="text"
                />
                <FormControl
                  v-model="clientForm.tin"
                  :label="__('Tax ID / TIN / EIN')"
                  placeholder="e.g. US-882-99120"
                  type="text"
                />
                <FormControl
                  v-model="clientForm.industry"
                  :label="__('Industry Sector')"
                  placeholder="e.g. Technology & SaaS"
                  type="text"
                />
                <FormControl
                  v-model="clientForm.website"
                  :label="__('Website URL')"
                  placeholder="e.g. https://acme.corp"
                  type="text"
                />
              </div>

              <!-- Billing Address -->
              <div class="space-y-2 pt-2">
                <FormControl
                  v-model="clientForm.billing_address_line1"
                  :label="__('Official Billing Street Address')"
                  placeholder="e.g. 450 Mission Street, Floor 14"
                  type="text"
                  required
                />
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormControl
                    v-model="clientForm.billing_city"
                    :label="__('City')"
                    placeholder="e.g. San Francisco"
                    type="text"
                    required
                  />
                  <FormControl
                    v-model="clientForm.billing_state_province"
                    :label="__('State / Province')"
                    placeholder="e.g. CA"
                    type="text"
                    required
                  />
                  <FormControl
                    v-model="clientForm.billing_postal_code"
                    :label="__('Postal / ZIP Code')"
                    placeholder="e.g. 94105"
                    type="text"
                    required
                  />
                </div>
              </div>
            </div>

            <!-- Section 2: Primary Contact Person -->
            <div class="space-y-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-ink-green-7 flex items-center gap-1.5 border-b border-outline-gray-1 pb-1">
                <span class="lucide-user-check size-4" />
                {{ __('2. Primary Contact Person & Representative') }}
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormControl
                  v-model="clientForm.first_name"
                  :label="__('First Name')"
                  placeholder="e.g. Sarah"
                  type="text"
                  required
                />
                <FormControl
                  v-model="clientForm.last_name"
                  :label="__('Last Name')"
                  placeholder="e.g. Connor"
                  type="text"
                />
                <FormControl
                  v-model="clientForm.primary_email"
                  :label="__('Contact / Billing Email')"
                  placeholder="e.g. client@acme.corp"
                  type="email"
                  required
                />
                <FormControl
                  v-model="clientForm.phone"
                  :label="__('Contact Phone / Mobile')"
                  placeholder="e.g. +1 (555) 789-0123"
                  type="text"
                  required
                />
                <FormControl
                  v-model="clientForm.job_title"
                  :label="__('Job Title / Role')"
                  placeholder="e.g. Chief Technology Officer"
                  type="text"
                />
                <FormControl
                  v-model="clientForm.national_id_number"
                  :label="__('National ID / Passport Number')"
                  placeholder="e.g. NAT-992-184-77"
                  type="text"
                />
              </div>
            </div>

            <!-- Section 3: Commercial Terms & Defaults -->
            <div class="space-y-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-ink-gray-7 flex items-center gap-1.5 border-b border-outline-gray-1 pb-1">
                <span class="lucide-badge-dollar-sign size-4" />
                {{ __('3. Commercial Defaults & Credit Settings') }}
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormControl
                  v-model="clientForm.default_currency"
                  :label="__('Currency')"
                  type="select"
                  :options="[
                    { label: 'USD ($)', value: 'USD' },
                    { label: 'EUR (€)', value: 'EUR' },
                    { label: 'GBP (£)', value: 'GBP' },
                    { label: 'CAD ($)', value: 'CAD' },
                    { label: 'AUD ($)', value: 'AUD' },
                  ]"
                />
                <FormControl
                  v-model="clientForm.default_payment_terms"
                  :label="__('Payment Terms')"
                  type="select"
                  :options="[
                    { label: 'Due on Receipt', value: 'Due on Receipt' },
                    { label: 'Net 15 Days', value: 'Net 15' },
                    { label: 'Net 30 Days', value: 'Net 30' },
                    { label: 'Net 60 Days', value: 'Net 60' },
                  ]"
                />
                <FormControl
                  v-model="clientForm.credit_limit"
                  :label="__('Credit Limit ($)')"
                  type="number"
                />
              </div>
            </div>

            <!-- Modal Footer Actions -->
            <div class="flex justify-end gap-2 pt-4 border-t border-outline-gray-1">
              <Button variant="outline" :label="__('Cancel')" @click="showClientModal = false" />
              <Button
                variant="solid"
                type="submit"
                :label="isEditing ? __('Save Changes') : __('Create Client Organization')"
                :loading="saving"
              />
            </div>
          </form>
        </div>
      </template>
    </Dialog>

    <!-- REJECT REQUEST MODAL -->
    <Dialog v-model:open="showRejectDialog" :size="'md'">
      <template #body>
        <div class="p-6 bg-surface-base text-ink-gray-9 space-y-4">
          <h3 class="text-base font-bold text-ink-gray-9">
            {{ __('Reject Detail Change Request') }}
          </h3>
          <p class="text-xs text-ink-gray-5">
            {{ __('Provide an official reason for the rejection that will be recorded in the client’s audit history.') }}
          </p>

          <FormControl
            v-model="rejectionReason"
            :label="__('Rejection Notes')"
            type="textarea"
            rows="3"
            placeholder="e.g. Official tax documents required before updating registered company name..."
            required
          />

          <div class="flex justify-end gap-2 pt-3 border-t border-outline-gray-1">
            <Button variant="outline" :label="__('Cancel')" @click="showRejectDialog = false" />
            <Button
              variant="solid"
              theme="red"
              :label="__('Confirm Rejection')"
              :disabled="!rejectionReason.trim()"
              @click="confirmRejection"
            />
          </div>
        </div>
      </template>
    </Dialog>

    <!-- Upgrade Client to Staff Modal -->
    <Dialog v-model:open="showUpgradeDialog" :size="'sm'">
      <template #body>
        <div class="p-6 bg-surface-base space-y-4">
          <div class="flex items-center gap-2 border-b border-outline-gray-1 pb-3">
            <span class="lucide-arrow-up-circle size-5 text-amber-600" />
            <h2 class="text-base font-bold text-ink-gray-9">
              {{ __('Upgrade Client to Staff Member') }}
            </h2>
          </div>
          <p class="text-xs text-ink-gray-7 leading-relaxed">
            Are you sure you want to upgrade <strong>{{ clientToUpgrade?.first_name ? `${clientToUpgrade.first_name} ${clientToUpgrade.last_name || ''}` : (clientToUpgrade?.contact_name || clientToUpgrade?.company_name) }}</strong> ({{ clientToUpgrade?.primary_email }}) to an internal <strong>Staff</strong> member?
          </p>
          <div class="p-3 bg-surface-amber-2/60 border border-outline-amber-2 rounded-lg text-xs space-y-1 text-ink-amber-8">
            <span class="font-bold flex items-center gap-1.5">
              <span class="lucide-shield-check size-3.5" />
              {{ __('Permission Elevation') }}
            </span>
            <p class="text-[11px] text-ink-gray-6">
              {{ __('This will elevate their account to CRM staff access, permitting internal pipeline management.') }}
            </p>
          </div>
          <div class="flex justify-end gap-2 pt-3 border-t border-outline-gray-1">
            <Button variant="subtle" :label="__('Cancel')" @click="showUpgradeDialog = false" />
            <Button
              variant="solid"
              theme="amber"
              iconLeft="arrow-up-right"
              :label="__('Confirm Upgrade')"
              @click="confirmUpgradeClient"
            />
          </div>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Button, Dialog, FormControl } from 'frappe-ui'
import LayoutHeader from '@/components/LayoutHeader.vue'
import { useBusinessStore } from '@/stores/business'

const business = useBusinessStore()

onMounted(async () => {
  await Promise.all([
    business.fetchClientsFromSupabase(),
    business.fetchChangeRequestsFromSupabase(),
  ])
})

async function refreshSupabaseData() {
  await Promise.all([
    business.fetchClientsFromSupabase(),
    business.fetchChangeRequestsFromSupabase(),
  ])
}

const activeTab = ref('all') // 'all' | 'pending' | 'history'
const searchQuery = ref('')
const showClientModal = ref(false)
const isEditing = ref(false)
const editingClientId = ref(null)
const saving = ref(false)

const showRejectDialog = ref(false)
const selectedReqToReject = ref(null)
const rejectionReason = ref('')

const clientForm = reactive({
  company_name: '',
  legal_structure: 'Corporation',
  company_registration_number: '',
  tin: '',
  industry: '',
  website: '',
  billing_address_line1: '',
  billing_city: '',
  billing_state_province: '',
  billing_postal_code: '',
  billing_country: 'United States',
  first_name: '',
  last_name: '',
  primary_email: '',
  phone: '',
  job_title: '',
  national_id_number: '',
  default_currency: 'USD',
  default_payment_terms: 'Net 30',
  credit_limit: 25000,
})

const filteredClients = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return business.customers

  return business.customers.filter((c) => {
    return (
      c.company_name?.toLowerCase().includes(query) ||
      c.first_name?.toLowerCase().includes(query) ||
      c.last_name?.toLowerCase().includes(query) ||
      c.primary_email?.toLowerCase().includes(query) ||
      c.company_registration_number?.toLowerCase().includes(query) ||
      c.tin?.toLowerCase().includes(query)
    )
  })
})

function openAddClientModal() {
  isEditing.value = false
  editingClientId.value = null
  Object.assign(clientForm, {
    company_name: '',
    legal_structure: 'Corporation',
    company_registration_number: '',
    tin: '',
    industry: '',
    website: '',
    billing_address_line1: '',
    billing_city: '',
    billing_state_province: '',
    billing_postal_code: '',
    billing_country: 'United States',
    first_name: '',
    last_name: '',
    primary_email: '',
    phone: '',
    job_title: 'Primary Representative',
    national_id_number: '',
    default_currency: 'USD',
    default_payment_terms: 'Net 30',
    credit_limit: 25000,
  })
  showClientModal.value = true
}

function openEditClientModal(c) {
  isEditing.value = true
  editingClientId.value = c.id
  Object.assign(clientForm, {
    company_name: c.company_name || '',
    legal_structure: c.legal_structure || 'Corporation',
    company_registration_number: c.company_registration_number || '',
    tin: c.tin || c.tax_id || '',
    industry: c.industry || '',
    website: c.website || '',
    billing_address_line1: c.billing_address_line1 || c.address || '',
    billing_city: c.billing_city || c.city || '',
    billing_state_province: c.billing_state_province || c.state || '',
    billing_postal_code: c.billing_postal_code || c.zip || '',
    billing_country: c.billing_country || 'United States',
    first_name: c.first_name || '',
    last_name: c.last_name || '',
    primary_email: c.billing_email || c.primary_email || '',
    phone: c.phone || '',
    job_title: c.job_title || '',
    national_id_number: c.national_id_number || '',
    default_currency: c.default_currency || 'USD',
    default_payment_terms: c.default_payment_terms || 'Net 30',
    credit_limit: c.credit_limit || 25000,
  })
  showClientModal.value = true
}

async function saveClient() {
  if (!clientForm.company_name.trim()) return

  saving.value = true
  if (isEditing.value && editingClientId.value) {
    await business.updateClient(editingClientId.value, { ...clientForm })
  } else {
    await business.addClient({ ...clientForm })
  }
  saving.value = false
  showClientModal.value = false
}

async function approveRequest(reqId) {
  await business.approveChangeRequest(reqId, business.currentUser?.full_name || 'Staff')
}

function openRejectModal(req) {
  selectedReqToReject.value = req
  rejectionReason.value = ''
  showRejectDialog.value = true
}

async function confirmRejection() {
  if (!selectedReqToReject.value || !rejectionReason.value.trim()) return
  await business.rejectChangeRequest(
    selectedReqToReject.value.id,
    rejectionReason.value.trim(),
    business.currentUser?.full_name || 'Staff'
  )
  showRejectDialog.value = false
  selectedReqToReject.value = null
}

const showUpgradeDialog = ref(false)
const clientToUpgrade = ref(null)

function promptUpgradeClient(c) {
  clientToUpgrade.value = c
  showUpgradeDialog.value = true
}

async function confirmUpgradeClient() {
  if (!clientToUpgrade.value) return
  const c = clientToUpgrade.value

  // Elevate their role to Staff in Supabase and store
  await business.updateUserRole(c.id, 'Staff')

  // Update in business.users
  const userIdx = business.users.findIndex(
    (u) => u.id === c.id || (c.primary_email && u.email?.toLowerCase() === c.primary_email.toLowerCase())
  )
  if (userIdx !== -1) {
    business.users[userIdx].role = 'Staff'
  } else {
    business.users.push({
      id: c.id,
      email: c.primary_email,
      full_name: c.first_name ? `${c.first_name} ${c.last_name || ''}`.trim() : c.company_name,
      role: 'Staff',
      avatar: null,
    })
  }

  // Remove from clients list
  business.customers = business.customers.filter((item) => item.id !== c.id)

  localStorage.setItem('crestara_users', JSON.stringify(business.users))
  localStorage.setItem('crestara_customers', JSON.stringify(business.customers))

  showUpgradeDialog.value = false
  clientToUpgrade.value = null
}
</script>
