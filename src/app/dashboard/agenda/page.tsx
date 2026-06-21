'use client';

import React from 'react';
import { useAgenda } from '@/hooks/useAgenda';
import AgendaHeader from '@/components/agenda/AgendaHeader';
import AgendaCalendar from '@/components/agenda/AgendaCalendar';
import RdvDrawer from '@/components/agenda/RdvDrawer';
import RdvCreateModal from '@/components/agenda/RdvCreateModal';
import RdvCancelModal from '@/components/agenda/RdvCancelModal';
import PatientConversionModal from '@/components/agenda/PatientConversionModal';

export default function AgendaPage() {
  const agenda = useAgenda();

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] sm:h-screen bg-white">
      <AgendaHeader
        currentDate={agenda.currentDate}
        view={agenda.view}
        onViewChange={agenda.setView}
        onPrev={agenda.goPrev}
        onNext={agenda.goNext}
        onToday={agenda.goToday}
        onNewRdv={() => agenda.openCreateModal()}
      />

      <AgendaCalendar
        currentDate={agenda.currentDate}
        view={agenda.view}
        rdvs={agenda.rdvs}
        loading={agenda.loading}
        onRdvClick={agenda.openDrawer}
        onSlotClick={(date) => agenda.openCreateModal(date)}
      />

      {/* Modals & Drawers */}
      <RdvDrawer
        rdv={agenda.selectedRdv}
        isOpen={agenda.drawerOpen}
        onClose={agenda.closeDrawer}
        onConfirmer={agenda.handleConfirmer}
        onTerminer={agenda.handleTerminer}
        onAnnuler={agenda.openCancelModal}
        onDelete={agenda.handleDelete}
      />

      {agenda.createModalOpen && (
        <RdvCreateModal
          isOpen={agenda.createModalOpen}
          onClose={agenda.closeCreateModal}
          onSubmit={agenda.handleCreateRdv}
          prefilledDate={agenda.prefilledDate}
        />
      )}

      {agenda.cancelModalOpen && agenda.selectedRdv && (
        <RdvCancelModal
          isOpen={agenda.cancelModalOpen}
          onClose={agenda.closeCancelModal}
          onConfirm={async (origine) => {
            await agenda.handleAnnuler(agenda.selectedRdv!.id, origine);
            agenda.closeDrawer();
          }}
        />
      )}

      {agenda.conversionData && (
        <PatientConversionModal
          data={agenda.conversionData}
          onClose={agenda.closeConversion}
          onConfirm={agenda.handleConvertPatient}
        />
      )}
    </div>
  );
}
